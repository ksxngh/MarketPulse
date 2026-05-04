"use server";

import { searchFinnhubStocks } from "@/lib/finnhub";
import { rateLimit } from "@/lib/security";

export async function searchStocks(query: string) {
  await rateLimit("stock-search", 60);
  const searchTerm = query.trim();
  if (searchTerm.length < 2) return [];
  if (searchTerm.length > 40) throw new Error("Search term is too long.");

  return searchFinnhubStocks(searchTerm);
}
