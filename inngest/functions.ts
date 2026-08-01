import { inngest } from "@/inngest/client";
import { ObjectId } from "mongodb";
import { generateNewsSummary, generateWelcomeIntro } from "@/lib/ai";
import {
  sendDailyNewsEmail,
  sendPriceAlertEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import {
  getCompanyNews,
  getGeneralNews,
  getStockQuote,
  type MarketNews,
} from "@/lib/finnhub";
import { connectToDatabase, getMongoDb } from "@/lib/mongodb";
import { Alert } from "@/lib/models/alert.model";
import { Watchlist } from "@/lib/models/watchlist.model";

type CreatedUserEvent = {
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const sendSignUpEmail = inngest.createFunction(
  { id: "send-sign-up-email", triggers: [{ event: "app/user.created" }] },
  async ({ event, step }) => {
    const user = (event as unknown as CreatedUserEvent).data;
    const intro = await step.run("generate-welcome-intro", () =>
      generateWelcomeIntro(user),
    );

    const emailResult = await step.run("send-welcome-email", () =>
      sendWelcomeEmail({
        to: user.email,
        firstName: user.firstName,
        intro,
      }),
    );

    return { sent: true, emailResult };
  },
);

export const dailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary", triggers: [{ cron: "0 12 * * *" }] },
  async ({ step }) => {
    const users = await step.run("get-users", async () => {
      const db = await getMongoDb();
      return db
        .collection("user")
        .find({ email: { $exists: true } })
        .toArray();
    });

    const results = [];

    for (const user of users) {
      const result = await step.run(`brief-${user._id}`, async () => {
        try {
          await connectToDatabase();
          const userId = String(user.id || user._id);
          const watchlist = await Watchlist.find({ userId }).lean();
          const symbols = watchlist.map((item) => item.symbol);
          let articles: MarketNews[] = [];

          for (const symbol of symbols.slice(0, 4)) {
            try {
              const news = await getCompanyNews(symbol);
              articles.push(...news.slice(0, 2));
            } catch (error) {
              console.warn("[MarketPulse daily summary] company news failed", {
                symbol,
                error: errorMessage(error),
              });
            }
          }

          if (articles.length === 0) {
            articles = (await getGeneralNews()).slice(0, 6);
          }

          articles = articles.slice(0, 6);

          let summary = `Here are today's market stories:\n\n${articles
            .map((article) => `- ${article.headline}`)
            .join("\n")}`;

          try {
            summary = await generateNewsSummary({
              firstName: user.firstName || user.name || "there",
              symbols,
              articles,
            });
          } catch (error) {
            console.warn("[MarketPulse daily summary] Gemini failed", {
              userId,
              error: errorMessage(error),
            });
          }

          await sendDailyNewsEmail({
            to: user.email,
            firstName: user.firstName || user.name || "there",
            summary,
            articles,
          });

          return { ok: true, userId, sent: true, symbols: symbols.length };
        } catch (error) {
          return {
            ok: false,
            userId: String(user.id || user._id),
            error: errorMessage(error),
          };
        }
      });

      results.push(result);
    }

    return { processed: results.length, results };
  },
);

export const checkPriceAlerts = inngest.createFunction(
  { id: "check-price-alerts", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const alerts = await step.run("get-active-alerts", async () => {
      await connectToDatabase();
      return Alert.find({ status: "active" }).sort({ createdAt: 1 }).lean();
    });

    const results = [];

    for (const alert of alerts) {
      const result = await step.run(`check-${alert._id}`, async () => {
        try {
          const quote = await getStockQuote(alert.symbol);
          const currentPrice = quote.currentPrice;
          const targetReached =
            alert.direction === "above"
              ? currentPrice >= alert.targetPrice
              : currentPrice <= alert.targetPrice;

          await Alert.updateOne(
            { _id: alert._id },
            { $set: { lastCheckedPrice: currentPrice } },
          );

          if (!targetReached) {
            return {
              ok: true,
              alertId: String(alert._id),
              symbol: alert.symbol,
              fired: false,
              currentPrice,
            };
          }

          const db = await getMongoDb();
          const userIdQueries: Record<string, unknown>[] = [
            { id: alert.userId },
            { _id: alert.userId },
          ];

          if (ObjectId.isValid(alert.userId)) {
            userIdQueries.push({ _id: new ObjectId(alert.userId) });
          }

          const user = await db
            .collection("user")
            .findOne({ $or: userIdQueries });

          if (!user?.email) {
            return {
              ok: false,
              alertId: String(alert._id),
              symbol: alert.symbol,
              fired: false,
              error: `No email found for userId ${alert.userId}`,
            };
          }

          await sendPriceAlertEmail({
            to: user.email,
            firstName: user.firstName || user.name || "there",
            symbol: alert.symbol,
            company: alert.company,
            direction: alert.direction,
            targetPrice: alert.targetPrice,
            currentPrice,
          });

          await Alert.updateOne(
            { _id: alert._id },
            {
              $set: {
                status: "fired",
                firedAt: new Date(),
                lastCheckedPrice: currentPrice,
              },
            },
          );

          return {
            ok: true,
            alertId: String(alert._id),
            symbol: alert.symbol,
            fired: true,
            currentPrice,
          };
        } catch (error) {
          return {
            ok: false,
            alertId: String(alert._id),
            symbol: alert.symbol,
            fired: false,
            error: errorMessage(error),
          };
        }
      });

      results.push(result);
    }

    return {
      checked: results.length,
      fired: results.filter((result) => result.fired).length,
      failed: results.filter((result) => !result.ok).length,
      results,
    };
  },
);
