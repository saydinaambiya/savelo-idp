import { redis } from "../redis/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export class RateLimiter {
  /**
   * Sliding window / Token Bucket rate limiter using Redis.
   * @param key Unique identifier (e.g. `rl:initiate:<ip>:<identifier>`)
   * @param limit Maximum allowed requests in the window
   * @param windowSeconds Window duration in seconds
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;

    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, clearBefore);
    // Add current timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    // Count active items
    pipeline.zcard(key);
    // Set key expiry
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      remaining,
      resetSeconds: windowSeconds,
    };
  }

  /**
   * Specifically tracks verification failure count for an IP address.
   */
  async recordVerificationFailure(ip: string, maxFailures = 5, windowSeconds = 3600): Promise<boolean> {
    const key = `rl:verify_fail:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count <= maxFailures;
  }

  /**
   * Checks if an IP is currently blocked due to excessive verification failures.
   */
  async isVerificationBlocked(ip: string, maxFailures = 5): Promise<boolean> {
    const key = `rl:verify_fail:${ip}`;
    const count = await redis.get(key);
    return count !== null && parseInt(count, 10) >= maxFailures;
  }
}

export const rateLimiter = new RateLimiter();
