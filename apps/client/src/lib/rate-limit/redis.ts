import { Redis } from "@upstash/redis";
import { env } from "../env";

let redisInstance: Redis | null = null;

/**
 * Returns a singleton instance of Upstash Redis if configured.
 * Returns null if URL or token is not provided or in testing without remote redis.
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
      // Retry strategy to avoid hangs
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 500),
      },
    });
    return redisInstance;
  } catch (error) {
    console.error("[RateLimit] Failed to initialize Upstash Redis client:", error);
    return null;
  }
}

/**
 * For testing and local isolation: allow setting a custom or mock Redis client.
 */
export function setRedisClient(client: Redis | null) {
  redisInstance = client;
}
