"use server";

import { getStockQuote, searchFinnhubStocks } from "@/lib/finnhub";
import { normalizeSymbol, rateLimit } from "@/lib/security";

export async function searchStocks(query: string) {
  await rateLimit("stock-search", 60);
  const searchTerm = query.trim();
  if (searchTerm.length < 2) return [];
  if (searchTerm.length > 40) throw new Error("Search term is too long.");

  return searchFinnhubStocks(searchTerm);
}

export async function getLiveStockQuote(symbol: string) {
  await rateLimit("stock-quote", 90);
  return getStockQuote(normalizeSymbol(symbol));
}
