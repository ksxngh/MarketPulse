"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/user.actions";
import { connectToDatabase } from "@/lib/mongodb";
import { Watchlist } from "@/lib/models/watchlist.model";
import { cleanText, normalizeSymbol, rateLimit } from "@/lib/security";

export async function getUserWatchlist() {
  const user = await getCurrentUser();
  if (!user) return [];

  await connectToDatabase();
  const items = await Watchlist.find({ userId: user.id }).sort({ addedAt: -1 }).lean();

  return items.map((item) => ({
    id: String(item._id),
    symbol: item.symbol,
    company: item.company,
    addedAt: item.addedAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function isInWatchlist(symbol: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  await connectToDatabase();
  const normalizedSymbol = normalizeSymbol(symbol);
  const item = await Watchlist.exists({
    userId: user.id,
    symbol: normalizedSymbol,
  });

  return Boolean(item);
}

export async function addToWatchlist(symbol: string, company: string) {
  await rateLimit("watchlist-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage your watchlist." };
  }

  const normalizedSymbol = normalizeSymbol(symbol);
  const cleanedCompany = cleanText(company, normalizedSymbol);

  await connectToDatabase();
  await Watchlist.updateOne(
    { userId: user.id, symbol: normalizedSymbol },
    {
      $set: {
        userId: user.id,
        symbol: normalizedSymbol,
        company: cleanedCompany,
      },
      $setOnInsert: { addedAt: new Date() },
    },
    { upsert: true }
  );

  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath(`/stocks/${normalizedSymbol}`);

  return { ok: true, message: `${normalizedSymbol} added to your watchlist.` };
}

export async function removeFromWatchlist(symbol: string) {
  await rateLimit("watchlist-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage your watchlist." };
  }

  const normalizedSymbol = normalizeSymbol(symbol);

  await connectToDatabase();
  await Watchlist.deleteOne({
    userId: user.id,
    symbol: normalizedSymbol,
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath(`/stocks/${normalizedSymbol}`);

  return { ok: true, message: `${normalizedSymbol} removed from your watchlist.` };
}
