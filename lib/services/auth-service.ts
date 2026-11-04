import {
  generateNumericOtp,
  generateSecureRandomToken,
  hashOtpWithPepper,
  hashToken,
  timingSafeStringEqual,
} from "../crypto/hash";
import { authStateRepository, type AuthRequestState } from "../repositories/auth-state-repository";
import { clientRepository } from "../repositories/client-repository";
import { userRepository } from "../repositories/user-repository";
import { sessionRepository } from "../repositories/session-repository";
import { eventService } from "./event-service";
import { rateLimiter } from "../utils/rate-limiter";
import { withConstantLatency } from "../utils/anti-enumeration";
import { ISSUER } from "../crypto/jwt";
import crypto from "crypto";

export interface InitiateAuthParams {
  identifier: string; // email or phone
  clientId: string;
  redirectUri?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  state?: string;
  scope?: string;
  nonce?: string;
  ipAddress?: string;
}

export interface VerifyAuthParams {
  sessionStateID: string;
  otp?: string;
  magicLinkToken?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Initiates the Zero-Password authentication flow (OTP + Magic Link).
   * Enforces Anti-Enumeration constant latency and Redis rate limiting.
   */
  async initiateAuth(params: InitiateAuthParams) {
    return withConstantLatency(async () => {
      const ip = params.ipAddress || "127.0.0.1";
      const normalizedIdentifier = params.identifier.trim().toLowerCase();

      // 1. Rate Limiting Check (Token Bucket: max 5 requests / 15 minutes per IP + Identifier)
      const rateLimitKey = `rl:initiate:${ip}:${normalizedIdentifier}`;
      const rateCheck = await rateLimiter.checkRateLimit(rateLimitKey, 5, 900);
      if (!rateCheck.allowed) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }

      // 2. Validate Client Application & Whitelist
      const client = await clientRepository.findByClientId(params.clientId);
      if (!client) {
        throw new Error("INVALID_CLIENT");
      }

      if (params.redirectUri && !clientRepository.validateRedirectUri(client, params.redirectUri)) {
        throw new Error("INVALID_REDIRECT_URI");
      }

      // 3. Generate Cryptographic Credentials
      const rawOtp = generateNumericOtp(6);
      const rawMagicToken = generateSecureRandomToken(32);
      const sessionStateID = crypto.randomUUID();

      // Hash credentials securely
      const otpHash = hashOtpWithPepper(rawOtp);
      const magicLinkHash = hashToken(rawMagicToken);

      // 4. Save State in Redis (ADR-001)
      const authState: AuthRequestState = {
        sessionStateID,
        clientId: params.clientId,
        identifier: normalizedIdentifier,
        otpHash,
        magicLinkHash,
        attempts: 0,
        isVerified: false,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod || "S256",
        redirectUri: params.redirectUri,
        state: params.state,
        scope: params.scope || "openid profile email",
        nonce: params.nonce,
        createdAt: Date.now(),
      };

      await authStateRepository.saveAuthRequest(sessionStateID, authState, 600); // 10 min TTL

      // 5. Construct Magic Link URL
      const magicLinkUrl = `${ISSUER}/verify?token=${rawMagicToken}&session_state_id=${sessionStateID}`;

      // In production, dispatch rawOtp via SMS/WhatsApp and magicLinkUrl via Email
      return {
        sessionStateID,
        magicLinkUrl,
        rawOtp: process.env.NODE_ENV !== "production" ? rawOtp : undefined,
      };
    });
  }

  /**
   * Verifies an OTP or Magic Link Token.
   */
  async verifyAuth(params: VerifyAuthParams) {
    const ip = params.ipAddress || "127.0.0.1";

    // 1. Check IP brute-force protection (Max 5 failures / hour)
    const isBlocked = await rateLimiter.isVerificationBlocked(ip, 5);
    if (isBlocked) {
      throw new Error("IP_TEMPORARILY_BLOCKED");
    }

    // 2. Fetch State from Redis
    const state = await authStateRepository.getAuthRequest(params.sessionStateID);
    if (!state) {
      throw new Error("EXPIRED_OR_INVALID_SESSION");
    }

    // 3. Check Attempt Counter
    if (state.attempts >= 3) {
      await authStateRepository.deleteAuthRequest(params.sessionStateID);
      await eventService.publishAuthEvent(params.sessionStateID, { status: "rejected" });
      throw new Error("MAX_ATTEMPTS_EXCEEDED");
    }

    // 4. Constant-Time Verification
    let isValid = false;

    if (params.otp) {
      const incomingOtpHash = hashOtpWithPepper(params.otp);
      isValid = timingSafeStringEqual(incomingOtpHash, state.otpHash);
    } else if (params.magicLinkToken) {
      const incomingMagicHash = hashToken(params.magicLinkToken);
      isValid = timingSafeStringEqual(incomingMagicHash, state.magicLinkHash);
    }

    if (!isValid) {
      await authStateRepository.incrementAttempts(params.sessionStateID);
      await rateLimiter.recordVerificationFailure(ip, 5, 3600);
      throw new Error("INVALID_CREDENTIALS");
    }

    // 5. Authentication Successful -> Auto-provision User
    const user = await userRepository.autoProvision(state.identifier);

    // 6. Handle OAuth vs Direct BFF Session
    let authCode: string | undefined;

    if (state.codeChallenge) {
      // Issue transient Authorization Code (180s TTL) in Redis
      authCode = generateSecureRandomToken(24);
      await authStateRepository.saveAuthorizationCode(authCode, {
        clientId: state.clientId,
        userId: user.id,
        redirectUri: state.redirectUri,
        codeChallenge: state.codeChallenge,
        codeChallengeMethod: state.codeChallengeMethod,
        scope: state.scope,
      }, 180);

      // Notify initiating browser via Redis Pub/Sub (Cross-device SSE)
      await eventService.publishAuthEvent(params.sessionStateID, {
        status: "verified",
        authCode,
        redirectUri: state.redirectUri,
        state: state.state,
      });
    }

    // Mark state verified in Redis
    state.isVerified = true;
    state.userId = user.id;
    state.authCode = authCode;
    await authStateRepository.saveAuthRequest(params.sessionStateID, state, 180);

    // Create session in PostgreSQL for direct IdP session
    const rawRefreshToken = generateSecureRandomToken(40);
    const sessionResult = await sessionRepository.createSession({
      userId: user.id,
      clientId: state.clientId,
      rawRefreshToken,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    return {
      success: true,
      user,
      authCode,
      redirectUri: state.redirectUri,
      state: state.state,
      session: sessionResult.session,
      rawRefreshToken: sessionResult.rawRefreshToken,
    };
  }
}

export const authService = new AuthService();
