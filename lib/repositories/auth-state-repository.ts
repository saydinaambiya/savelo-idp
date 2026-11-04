import { redis } from "../redis/redis";
import { hashToken } from "../crypto/hash";

export interface AuthRequestState {
  sessionStateID: string;
  clientId: string;
  identifier: string;
  otpHash: string;
  magicLinkHash: string;
  attempts: number;
  isVerified: boolean;
  userId?: string;
  authCode?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  redirectUri?: string;
  state?: string;
  nonce?: string;
  scope?: string;
  createdAt: number;
}

export interface AuthorizationCodeData {
  clientId: string;
  userId: string;
  redirectUri?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  scope?: string;
}

const AUTH_REQUEST_TTL = 600; // 10 minutes
const AUTH_CODE_TTL = 180; // 3 minutes max
const RTR_REUSED_CACHE_TTL = 86400; // 24 hours

export class AuthStateRepository {
  /**
   * Saves or updates the transient AuthRequest state in Redis with 10-min TTL.
   */
  async saveAuthRequest(
    sessionStateID: string,
    state: AuthRequestState,
    ttlSeconds = AUTH_REQUEST_TTL
  ): Promise<void> {
    const key = `auth:req:${sessionStateID}`;
    await redis.set(key, JSON.stringify(state), "EX", ttlSeconds);
  }

  /**
   * Retrieves the AuthRequest state from Redis.
   */
  async getAuthRequest(sessionStateID: string): Promise<AuthRequestState | null> {
    const key = `auth:req:${sessionStateID}`;
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthRequestState;
    } catch {
      return null;
    }
  }

  /**
   * Increments the attempt counter in the AuthRequest state.
   */
  async incrementAttempts(sessionStateID: string): Promise<number> {
    const state = await this.getAuthRequest(sessionStateID);
    if (!state) return 0;

    state.attempts += 1;
    // Keep remaining TTL
    const key = `auth:req:${sessionStateID}`;
    const remainingTtl = await redis.ttl(key);
    await redis.set(
      key,
      JSON.stringify(state),
      "EX",
      remainingTtl > 0 ? remainingTtl : AUTH_REQUEST_TTL
    );
    return state.attempts;
  }

  /**
   * Deletes an AuthRequest state (e.g. after max attempts reached or completed).
   */
  async deleteAuthRequest(sessionStateID: string): Promise<void> {
    await redis.del(`auth:req:${sessionStateID}`);
  }

  /**
   * Stores an issued short-lived authorization code in Redis.
   */
  async saveAuthorizationCode(
    code: string,
    data: AuthorizationCodeData,
    ttlSeconds = AUTH_CODE_TTL
  ): Promise<void> {
    const key = `auth:code:${code}`;
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  }

  /**
   * Atomically fetches and invalidates an authorization code (one-time use).
   */
  async consumeAuthorizationCode(
    code: string
  ): Promise<AuthorizationCodeData | null> {
    const key = `auth:code:${code}`;
    // Redis GETDEL is atomic
    let raw: string | null = null;
    try {
      raw = (await (redis as unknown as { getdel: (k: string) => Promise<string | null> }).getdel(key)) || null;
    } catch {
      // Fallback for older Redis versions
      const pipeline = redis.pipeline();
      pipeline.get(key);
      pipeline.del(key);
      const results = await pipeline.exec();
      raw = (results?.[0]?.[1] as string) || null;
    }

    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthorizationCodeData;
    } catch {
      return null;
    }
  }

  /**
   * Records a rotated refresh token in the used-token cache.
   * If this token is seen again, a token theft event is triggered.
   */
  async recordUsedRefreshToken(
    rawRefreshToken: string,
    familyId: string
  ): Promise<void> {
    const hash = hashToken(rawRefreshToken);
    await redis.set(
      `rtr:used:${hash}`,
      JSON.stringify({ familyId, rotatedAt: Date.now() }),
      "EX",
      RTR_REUSED_CACHE_TTL
    );
  }

  /**
   * Checks if a refresh token was previously rotated (indicates token reuse/theft).
   */
  async checkReusedRefreshToken(
    rawRefreshToken: string
  ): Promise<{ familyId: string } | null> {
    const hash = hashToken(rawRefreshToken);
    const raw = await redis.get(`rtr:used:${hash}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const authStateRepository = new AuthStateRepository();
