import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getSigningKeys } from "./keys";
import crypto from "crypto";

export const ISSUER = process.env.IDP_ISSUER_URL || "http://localhost:3000";

export interface TokenClaims {
  sub: string;
  aud: string;
  email?: string | null;
  phone?: string | null;
  nonce?: string;
  scope?: string;
}

/**
 * Signs an RS256 Access Token.
 * Default expiration: 15 minutes.
 */
export async function signAccessToken(claims: TokenClaims, expiresIn = "15m"): Promise<string> {
  const { privateKey, kid } = await getSigningKeys();

  return new SignJWT({
    scope: claims.scope || "openid profile email",
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

/**
 * Signs an RS256 OpenID Connect ID Token.
 * Default expiration: 1 hour.
 */
export async function signIdToken(claims: TokenClaims, expiresIn = "1h"): Promise<string> {
  const { privateKey, kid } = await getSigningKeys();

  const jwt = new SignJWT({
    email: claims.email ?? undefined,
    phone: claims.phone ?? undefined,
    email_verified: Boolean(claims.email),
    nonce: claims.nonce,
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  return jwt.sign(privateKey);
}

/**
 * Verifies an RS256 token against the public key and expected audience.
 */
export async function verifyJwt(token: string, expectedAudience: string): Promise<JWTPayload> {
  const { publicKey } = await getSigningKeys();

  const { payload } = await jwtVerify(token, publicKey, {
    issuer: ISSUER,
    audience: expectedAudience,
  });

  return payload;
}
