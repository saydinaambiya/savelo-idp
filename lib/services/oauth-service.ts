import { authStateRepository } from "../repositories/auth-state-repository";
import { clientRepository } from "../repositories/client-repository";
import { sessionRepository } from "../repositories/session-repository";
import { userRepository } from "../repositories/user-repository";
import { verifyPkce } from "../crypto/pkce";
import { signAccessToken, signIdToken, verifyJwt } from "../crypto/jwt";
import { generateSecureRandomToken } from "../crypto/hash";

export interface CodeExchangeParams {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshExchangeParams {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
}

export class OAuthService {
  /**
   * Exchanges an Authorization Code with PKCE verification for Access Token & ID Token.
   */
  async exchangeCode(params: CodeExchangeParams) {
    // 1. Consume code from Redis (single-use guarantee)
    const codeData = await authStateRepository.consumeAuthorizationCode(params.code);
    if (!codeData) {
      throw new Error("INVALID_OR_EXPIRED_CODE");
    }

    // 2. Validate Client
    if (codeData.clientId !== params.clientId) {
      throw new Error("CLIENT_MISMATCH");
    }

    const client = await clientRepository.findByClientId(params.clientId);
    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    // If client secret is provided, validate it
    if (params.clientSecret && !clientRepository.validateClientSecret(client, params.clientSecret)) {
      throw new Error("INVALID_CLIENT_SECRET");
    }

    // 3. Validate Redirect URI
    if (codeData.redirectUri && params.redirectUri !== codeData.redirectUri) {
      throw new Error("REDIRECT_URI_MISMATCH");
    }

    // 4. Validate PKCE code_verifier
    if (codeData.codeChallenge) {
      if (!params.codeVerifier) {
        throw new Error("CODE_VERIFIER_REQUIRED");
      }
      const isPkceValid = verifyPkce(
        params.codeVerifier,
        codeData.codeChallenge,
        codeData.codeChallengeMethod || "S256"
      );
      if (!isPkceValid) {
        throw new Error("INVALID_CODE_VERIFIER");
      }
    }

    // 5. Fetch User
    const user = await userRepository.findById(codeData.userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // 6. Sign RS256 Tokens (aud = client_id)
    const claims = {
      sub: user.id,
      aud: client.clientId,
      email: user.email,
      phone: user.phone,
      scope: codeData.scope,
    };

    const accessToken = await signAccessToken(claims, "15m");
    const idToken = await signIdToken(claims, "1h");

    // 7. Generate Refresh Token & Register Session with Token Family
    const rawRefreshToken = generateSecureRandomToken(40);
    const { session } = await sessionRepository.createSession({
      userId: user.id,
      clientId: client.clientId,
      rawRefreshToken,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 900, // 15 minutes
      refresh_token: rawRefreshToken,
      id_token: idToken,
      scope: codeData.scope || "openid profile email",
      session_id: session.id,
    };
  }

  /**
   * Exchanges a Refresh Token for a new token pair using Refresh Token Rotation (RTR).
   * Implements strict Token Family Revocation if token theft/reuse is detected.
   */
  async exchangeRefreshToken(params: RefreshExchangeParams) {
    // 1. Check if token was already used/rotated (Breach detection)
    const reusedCheck = await authStateRepository.checkReusedRefreshToken(params.refreshToken);
    if (reusedCheck) {
      // SECURITY INCIDENT: Token theft detected! Revoke entire token family!
      await sessionRepository.revokeFamily(reusedCheck.familyId);
      throw new Error("TOKEN_THEFT_DETECTED");
    }

    // 2. Find active session in PostgreSQL
    const session = await sessionRepository.findByRefreshToken(params.refreshToken);
    if (!session || session.clientId !== params.clientId) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (new Date() > session.expiresAt) {
      await sessionRepository.revokeSession(session.id);
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    // 3. Record current token into used cache before rotating
    await authStateRepository.recordUsedRefreshToken(params.refreshToken, session.familyId);

    // 4. Generate new refresh token and rotate session
    const newRawRefreshToken = generateSecureRandomToken(40);
    await sessionRepository.rotateToken(session.id, newRawRefreshToken, 30);

    // 5. Issue new RS256 Access & ID Tokens
    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const claims = {
      sub: user.id,
      aud: session.clientId,
      email: user.email,
      phone: user.phone,
    };

    const accessToken = await signAccessToken(claims, "15m");
    const idToken = await signIdToken(claims, "1h");

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 900,
      refresh_token: newRawRefreshToken,
      id_token: idToken,
    };
  }

  /**
   * OIDC UserInfo endpoint handler.
   */
  async getUserInfo(accessToken: string, expectedAudience: string) {
    const payload = await verifyJwt(accessToken, expectedAudience);
    if (!payload.sub) {
      throw new Error("INVALID_TOKEN_SUBJECT");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      sub: user.id,
      email: user.email,
      email_verified: Boolean(user.email),
      phone: user.phone,
      updated_at: Math.floor(user.updatedAt.getTime() / 1000),
    };
  }
}

export const oauthService = new OAuthService();
