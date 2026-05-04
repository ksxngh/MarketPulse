import { headers } from "next/headers";

const buckets = new Map<string, { count: number; resetAt: number }>();

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
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new Error("Too many requests. Try again shortly.");
  }
}
