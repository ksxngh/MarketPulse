const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

function memoryRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

async function upstashRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) return null;

  const baseUrl = redisUrl.replace(/\/$/, "");
  const encodedKey = encodeURIComponent(`marketpulse:${key}`);
  const headers = { Authorization: `Bearer ${redisToken}` };

  const incrementResponse = await fetch(`${baseUrl}/incr/${encodedKey}`, {
    headers,
    cache: "no-store",
  });

  if (!incrementResponse.ok) return null;

  const data = (await incrementResponse.json()) as { result?: number };
  const count = Number(data.result || 0);

  if (count === 1) {
    await fetch(
      `${baseUrl}/expire/${encodedKey}/${Math.ceil(windowMs / 1000)}`,
      {
        headers,
        cache: "no-store",
      },
    );
  }

  return count > limit;
}

export async function isRateLimited(options: RateLimitOptions) {
  try {
    const limited = await upstashRateLimit(options);
    if (limited !== null) return limited;
  } catch {
    // Fall back to the local limiter if Redis is unavailable.
  }

  return memoryRateLimit(options);
}
