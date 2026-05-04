import { inngest } from "@/inngest/client";
import { ObjectId } from "mongodb";
import { generateNewsSummary, generateWelcomeIntro } from "@/lib/ai";
import { sendDailyNewsEmail, sendPriceAlertEmail, sendWelcomeEmail } from "@/lib/email";
import { getCompanyNews, getGeneralNews, getStockQuote, type MarketNews } from "@/lib/finnhub";
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

export const sendSignUpEmail = inngest.createFunction(
  { id: "send-sign-up-email", triggers: [{ event: "app/user.created" }] },
  async ({ event, step }) => {
    const user = (event as unknown as CreatedUserEvent).data;
    const intro = await step.run("generate-welcome-intro", () =>
      generateWelcomeIntro(user)
    );

    await step.run("send-welcome-email", () =>
      sendWelcomeEmail({
        to: user.email,
        firstName: user.firstName,
        intro,
      })
    );

    return { sent: true };
  }
);

export const dailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary", triggers: [{ cron: "0 12 * * *" }] },
  async ({ step }) => {
    const users = await step.run("get-users", async () => {
      const db = await getMongoDb();
      return db.collection("user").find({ email: { $exists: true } }).toArray();
    });

    const results = [];

    for (const user of users) {
      const result = await step.run(`brief-${user._id}`, async () => {
        await connectToDatabase();
        const userId = String(user.id || user._id);
        const watchlist = await Watchlist.find({ userId }).lean();
        const symbols = watchlist.map((item) => item.symbol);
        let articles: MarketNews[] = [];

        for (const symbol of symbols.slice(0, 4)) {
          const news = await getCompanyNews(symbol);
          articles.push(...news.slice(0, 2));
        }

        if (articles.length === 0) {
          articles = (await getGeneralNews()).slice(0, 6);
        }

        articles = articles.slice(0, 6);
        const summary = await generateNewsSummary({
          firstName: user.firstName || user.name || "there",
          symbols,
          articles,
        });

        await sendDailyNewsEmail({
          to: user.email,
          firstName: user.firstName || user.name || "there",
          summary,
          articles,
        });

        return { userId, sent: true, symbols: symbols.length };
      });

      results.push(result);
    }

    return { processed: results.length, results };
  }
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
        const quote = await getStockQuote(alert.symbol);
        const currentPrice = quote.currentPrice;
        const targetReached =
          alert.direction === "above"
            ? currentPrice >= alert.targetPrice
            : currentPrice <= alert.targetPrice;

        await Alert.updateOne(
          { _id: alert._id },
          { $set: { lastCheckedPrice: currentPrice } }
        );

        if (!targetReached) {
          return { alertId: String(alert._id), fired: false, currentPrice };
        }

        const db = await getMongoDb();
        const userIdQueries: Record<string, unknown>[] = [
          { id: alert.userId },
          { _id: alert.userId },
        ];

        if (ObjectId.isValid(alert.userId)) {
          userIdQueries.push({ _id: new ObjectId(alert.userId) });
        }

        const user = await db.collection("user").findOne({ $or: userIdQueries });

        if (user?.email) {
          await sendPriceAlertEmail({
            to: user.email,
            firstName: user.firstName || user.name || "there",
            symbol: alert.symbol,
            company: alert.company,
            direction: alert.direction,
            targetPrice: alert.targetPrice,
            currentPrice,
          });
        }

        await Alert.updateOne(
          { _id: alert._id },
          {
            $set: {
              status: "fired",
              firedAt: new Date(),
              lastCheckedPrice: currentPrice,
            },
          }
        );

        return { alertId: String(alert._id), fired: true, currentPrice };
      });

      results.push(result);
    }

    return { checked: results.length, fired: results.filter((result) => result.fired).length };
  }
);
