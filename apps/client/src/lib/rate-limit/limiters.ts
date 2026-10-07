import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./redis";

export interface RateLimitCheckResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export type RateLimiterType = "api" | "vote_ip" | "vote_user" | "auth_ip" | "admin_user" | "admin_ip";

interface LimiterConfig {
  requests: number;
  windowStr: "1 m" | "1 h";
  prefix: string;
}

export const LIMITER_CONFIGS: Record<RateLimiterType, LimiterConfig> = {
  // 1. General API traffic: 60 requests / minute / IP
  api: {
    requests: 60,
    windowStr: "1 m",
    prefix: "ratelimit:api:ip",
  },
  // 2. Voting IP limit: 30 vote requests / minute / IP
  vote_ip: {
    requests: 30,
    windowStr: "1 m",
    prefix: "ratelimit:vote:ip",
  },
  // 2. Voting User limit: 10 vote requests / minute / user
  vote_user: {
    requests: 10,
    windowStr: "1 m",
    prefix: "ratelimit:vote:user",
  },
  // 3. Sensitive Auth IP limit: 10 requests / minute / IP
  auth_ip: {
    requests: 10,
    windowStr: "1 m",
    prefix: "ratelimit:auth:ip",
  },
  // 4. Admin mutation User limit: 10 requests / minute / admin user
  admin_user: {
    requests: 10,
    windowStr: "1 m",
    prefix: "ratelimit:admin:user",
  },
  // 4. Admin mutation IP limit: 20 requests / minute / IP
  admin_ip: {
    requests: 20,
    windowStr: "1 m",
    prefix: "ratelimit:admin:ip",
  },
};

// In-memory sliding window fallback for unit tests, local dev, or Redis outage
class MemorySlidingWindow {
  private hits: Map<string, number[]> = new Map();

  check(key: string, limit: number, windowMs: number): RateLimitCheckResult {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (this.hits.get(key) || []).filter((ts) => ts > windowStart);

    if (timestamps.length >= limit) {
      const oldestInWindow = timestamps[0] || now;
      const reset = oldestInWindow + windowMs;
      this.hits.set(key, timestamps);
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - timestamps.length),
      reset: now + windowMs,
    };
  }

  reset() {
    this.hits.clear();
  }
}

const memoryFallback = new MemorySlidingWindow();

// Cache of Upstash Ratelimit instances per type to reuse connection
const ratelimitInstances = new Map<RateLimiterType, Ratelimit>();

function getUpstashLimiter(type: RateLimiterType): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  let limiter = ratelimitInstances.get(type);
  if (!limiter) {
    const cfg = LIMITER_CONFIGS[type];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.requests, cfg.windowStr),
      prefix: cfg.prefix,
      analytics: false,
    });
    ratelimitInstances.set(type, limiter);
  }
  return limiter;
}

/**
 * Executes a rate limit check with fail-open resilience.
 *
 * If Redis is not configured (or errors out), it uses the memory fallback in non-production,
 * or gracefully fails open with structured logging in production to prevent platform outages.
 */
export async function checkRateLimit(
  type: RateLimiterType,
  identifier: string,
): Promise<RateLimitCheckResult> {
  const cfg = LIMITER_CONFIGS[type];
  const upstashLimiter = getUpstashLimiter(type);

  if (!upstashLimiter) {
    // Upstash Redis not configured: Use memory sliding window
    const windowMs = cfg.windowStr === "1 m" ? 60 * 1000 : 3600 * 1000;
    const compositeKey = `${cfg.prefix}:${identifier}`;
    return memoryFallback.check(compositeKey, cfg.requests, windowMs);
  }

  try {
    const result = await upstashLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error(`[RateLimit Error] Upstash check failed for ${type}:${maskIdentifier(identifier)}. Failing open safely.`, error);
    // Resilience policy: Fail-open with safe defaults
    return {
      success: true,
      limit: cfg.requests,
      remaining: 1,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Mask identifiers (IPs and user IDs) in log outputs for privacy compliance.
 */
export function maskIdentifier(id: string): string {
  if (!id) return "unknown";
  if (id.includes(".")) {
    // IPv4: mask middle octets
    const parts = id.split(".");
    if (parts.length === 4) return `${parts[0]}.*.*.${parts[3]}`;
  }
  if (id.includes(":")) {
    // IPv6: truncate
    return `${id.slice(0, 4)}:***:${id.slice(-4)}`;
  }
  // User ID or other: keep prefix
  return id.length > 6 ? `${id.slice(0, 4)}...${id.slice(-2)}` : `${id.slice(0, 2)}***`;
}

export function resetMemoryFallback() {
  memoryFallback.reset();
}
