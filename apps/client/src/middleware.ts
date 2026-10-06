import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "./lib/rate-limit/ip";
import { checkRateLimit, maskIdentifier } from "./lib/rate-limit/limiters";
import { createRateLimitResponse } from "./lib/rate-limit/response";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Never rate-limit static assets, Next internal files, or images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Never rate-limit webhooks or upload endpoints
  if (
    pathname.startsWith("/api/v1/webhooks") ||
    pathname.startsWith("/api/v1/uploadthings")
  ) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);

  // 3. Stricter IP rate limiting on sensitive Better Auth mutations (Sign in, sign up, password changes)
  if (
    pathname.startsWith("/api/auth") &&
    request.method === "POST" &&
    (pathname.includes("sign-in") ||
      pathname.includes("sign-up") ||
      pathname.includes("forget-password") ||
      pathname.includes("reset-password") ||
      pathname.includes("change-password"))
  ) {
    const authResult = await checkRateLimit("auth_ip", clientIp);
    if (!authResult.success) {
      console.warn(
        `[RateLimit Blocked] Auth mutation limit exceeded for IP: ${maskIdentifier(clientIp)} on ${pathname}`,
      );
      return createRateLimitResponse(
        authResult,
        "Too many authentication attempts. Please try again in a minute.",
      );
    }
    return NextResponse.next();
  }

  // 4. Endpoints with specialized in-handler rate limits (like voting and admin mutations)
  // We let them pass to their specific multi-layer rate limiters in the route handlers
  // to avoid double-counting or conflicts with stricter/user-based limiters.
  const isSpecializedEndpoint =
    pathname.includes("/vote") ||
    (pathname.startsWith("/api/v1/admin") && request.method !== "GET");

  if (isSpecializedEndpoint) {
    return NextResponse.next();
  }

  // 5. General API rate limit for remaining /api routes (60 req/min/IP)
  if (pathname.startsWith("/api/")) {
    const apiResult = await checkRateLimit("api", clientIp);
    if (!apiResult.success) {
      console.warn(
        `[RateLimit Blocked] General API limit exceeded for IP: ${maskIdentifier(clientIp)} on ${pathname}`,
      );
      return createRateLimitResponse(apiResult);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
