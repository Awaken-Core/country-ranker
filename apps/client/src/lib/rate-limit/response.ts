import { NextResponse } from "next/server";

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in ms
}

/**
 * Builds a standardized HTTP 429 response with industry standard rate limit headers.
 * Does not expose internal Redis details or sensitive telemetry.
 */
export function createRateLimitResponse(
  info?: Partial<RateLimitInfo>,
  customMessage = "Too many requests. Please slow down and try again later.",
): NextResponse {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  if (info) {
    if (typeof info.limit === "number") {
      headers.set("X-RateLimit-Limit", info.limit.toString());
    }
    if (typeof info.remaining === "number") {
      headers.set("X-RateLimit-Remaining", Math.max(0, info.remaining).toString());
    }
    if (typeof info.reset === "number") {
      headers.set("X-RateLimit-Reset", Math.ceil(info.reset / 1000).toString());
      const retryAfterSeconds = Math.max(1, Math.ceil((info.reset - Date.now()) / 1000));
      headers.set("Retry-After", retryAfterSeconds.toString());
    }
  }

  return NextResponse.json(
    {
      error: "RATE_LIMITED",
      message: customMessage,
    },
    {
      status: 429,
      headers,
    },
  );
}
