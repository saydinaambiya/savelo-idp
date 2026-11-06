import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

declare global {
  var __redisClient: Redis | undefined;
}

export function getRedisClient(): Redis {
  if (global.__redisClient) {
    return global.__redisClient;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    // Log error gracefully rather than crashing entire server if Redis temporarily disconnects
    console.error("[Redis Error]:", err.message);
  });

  // Preserve client in global scope to reuse across warm serverless/Lambda invocations
  global.__redisClient = client;

  return client;
}

/**
 * Creates a dedicated subscriber connection for Redis Pub/Sub.
 * In Redis, a connection in subscribed state cannot issue normal commands.
 */
export function createRedisSubscriber(): Redis {
  const sub = new Redis(redisUrl, {
    lazyConnect: true,
  });

  sub.on("error", (err) => {
    console.error("[Redis Subscriber Error]:", err.message);
  });

  return sub;
}

export const redis = getRedisClient();
