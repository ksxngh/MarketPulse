import { headers } from "next/headers";
import { isRateLimited } from "@/lib/rate-limit";

export function normalizeSymbol(value: string) {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,16}$/.test(symbol)) {
    throw new Error("Invalid stock symbol.");
  }
  return symbol;
}

export function cleanText(value: string, fallback: string, maxLength = 120) {
  const cleaned = value.replace(/[<>]/g, "").trim().slice(0, maxLength);
  return cleaned || fallback;
}

export async function rateLimit(scope: string, limit = 30, windowMs = 60_000) {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "local";

  if (await isRateLimited({ key: `${scope}:${ip}`, limit, windowMs })) {
    throw new Error("Too many requests. Try again shortly.");
  }
}
