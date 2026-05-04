import { env } from "@/lib/env";

export type FinnhubSearchResult = {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
};

export type MarketNews = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export type StockQuote = {
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
};

async function finnhubFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!env.finnhubApiKey) {
    throw new Error("Missing FINNHUB_API_KEY. Add it to .env.local to fetch live market data.");
  }

  const url = new URL(`https://finnhub.io/api/v1/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("token", env.finnhubApiKey);

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Finnhub request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function searchFinnhubStocks(query: string) {
  const data = await finnhubFetch<{ count: number; result: FinnhubSearchResult[] }>("search", {
    q: query,
  });

  return data.result
    .filter((item) => item.symbol && item.description)
    .slice(0, 8);
}

export async function getCompanyNews(symbol: string) {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 7);

  const format = (date: Date) => date.toISOString().slice(0, 10);

  return finnhubFetch<MarketNews[]>("company-news", {
    symbol,
    from: format(past),
    to: format(now),
  });
}

export async function getGeneralNews() {
  return finnhubFetch<MarketNews[]>("news", { category: "general" });
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const quote = await finnhubFetch<{
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
    t: number;
  }>("quote", { symbol });

  return {
    currentPrice: quote.c,
    change: quote.d,
    percentChange: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    timestamp: quote.t,
  };
}

export async function getMarketDashboardData() {
  const symbols = [
    { symbol: "AAPL", company: "Apple Inc" },
    { symbol: "MSFT", company: "Microsoft Corp" },
    { symbol: "NVDA", company: "NVIDIA Corp" },
    { symbol: "AMZN", company: "Amazon.com Inc" },
    { symbol: "META", company: "Meta Platforms" },
    { symbol: "NFLX", company: "Netflix Inc" },
  ];

  const indices = [
    { symbol: "SPY", name: "S&P 500 ETF" },
    { symbol: "QQQ", name: "Nasdaq 100 ETF" },
    { symbol: "DIA", name: "Dow 30 ETF" },
  ];

  const [stockQuotes, indexQuotes, news] = await Promise.all([
    Promise.all(
      symbols.map(async (item) => ({
        ...item,
        quote: await getStockQuote(item.symbol),
      }))
    ),
    Promise.all(
      indices.map(async (item) => ({
        ...item,
        quote: await getStockQuote(item.symbol),
      }))
    ),
    getGeneralNews(),
  ]);

  return {
    stocks: stockQuotes.map((item) => ({
      company: item.company,
      symbol: item.symbol,
      price: item.quote.currentPrice,
      change: item.quote.percentChange,
      high: item.quote.high,
      low: item.quote.low,
      open: item.quote.open,
      previousClose: item.quote.previousClose,
    })),
    indices: indexQuotes.map((item) => ({
      name: item.name,
      symbol: item.symbol,
      price: item.quote.currentPrice,
      change: item.quote.percentChange,
    })),
    news: news.slice(0, 4),
  };
}
