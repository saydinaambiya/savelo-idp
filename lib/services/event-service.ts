import { redis, createRedisSubscriber } from "../redis/redis";
import Redis from "ioredis";

export interface AuthSyncEvent {
  status: "verified" | "expired" | "rejected";
  authCode?: string;
  redirectUri?: string;
  state?: string;
}

export class EventService {
  private channelPrefix = "auth_sync:";

  /**
   * Publishes an authentication success/verification event to the cross-device channel.
   */
  async publishAuthEvent(
    sessionStateID: string,
    event: AuthSyncEvent
  ): Promise<void> {
    const channel = `${this.channelPrefix}${sessionStateID}`;
    await redis.publish(channel, JSON.stringify(event));
  }

  /**
   * Subscribes to events for a specific sessionStateID (used by SSE Route Handler).
   * Returns a cleanup function to close subscription and connection.
   */
  subscribeToAuthEvent(
    sessionStateID: string,
    onMessage: (event: AuthSyncEvent) => void
  ): () => void {
    const sub: Redis = createRedisSubscriber();
    const channel = `${this.channelPrefix}${sessionStateID}`;

    sub.subscribe(channel, (err) => {
      if (err) {
        console.error(`[EventService] Failed to subscribe to ${channel}:`, err);
      }
    });

    sub.on("message", (ch, message) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(message) as AuthSyncEvent;
          onMessage(parsed);
        } catch (e) {
          console.error("[EventService] Error parsing event message:", e);
        }
      }
    });

    return () => {
      sub.unsubscribe(channel).catch(() => {});
      sub.quit().catch(() => {});
    };
  }
}

export const eventService = new EventService();
