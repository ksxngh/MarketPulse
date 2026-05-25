import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

const securityHeaders = {
  "X-DNS-Prefetch-Control": "on",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api/auth") &&
    isRateLimited(`auth:${clientIp(request)}`, 20, 60_000)
  ) {
    return NextResponse.json(
      { error: "Too many auth requests. Try again shortly." },
      { status: 429 },
    );
  }

  if (
    pathname.startsWith("/api") &&
    isRateLimited(`api:${clientIp(request)}`, 120, 60_000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
