"use server";

import { getCurrentUser } from "@/actions/user.actions";
import { getUserWatchlist } from "@/actions/watchlist.actions";
import { generateNewsSummary } from "@/lib/ai";
import { sendDailyNewsEmail } from "@/lib/email";
import {
  getCompanyNews,
  getGeneralNews,
  type MarketNews,
} from "@/lib/finnhub";
import { rateLimit } from "@/lib/security";

export async function sendDailySummaryNow() {
  await rateLimit("daily-summary-now", 5);
  const user = await getCurrentUser();

  if (!user?.email) {
    return { ok: false, message: "Sign in to send a briefing." };
  }

  const watchlist = await getUserWatchlist();
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
    firstName: user.name?.split(" ")[0] || "there",
    symbols,
    articles,
  });

  await sendDailyNewsEmail({
    to: user.email,
    firstName: user.name?.split(" ")[0] || "there",
    summary,
    articles,
  });

  return {
    ok: true,
    message: `Sent a daily briefing to ${user.email}.`,
  };
}
