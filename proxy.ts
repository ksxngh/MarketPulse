import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api/auth") &&
    (await isRateLimited({
      key: `auth:${clientIp(request)}`,
      limit: 20,
      windowMs: 60_000,
    }))
  ) {
    return NextResponse.json(
      { error: "Too many auth requests. Try again shortly." },
      { status: 429 },
    );
  }

  if (
    pathname.startsWith("/api") &&
    (await isRateLimited({
      key: `api:${clientIp(request)}`,
      limit: 120,
      windowMs: 60_000,
    }))
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
