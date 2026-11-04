import crypto from "crypto";
import { timingSafeStringEqual } from "./hash";

/**
 * Computes base64url-encoded SHA-256 hash of code_verifier for PKCE S256.
 */
export function computePkceChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

/**
 * Validates a PKCE code_verifier against the stored code_challenge.
 */
export function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method = "S256"
): boolean {
  if (method === "plain") {
    return timingSafeStringEqual(codeVerifier, codeChallenge);
  }

  if (method === "S256") {
    const computed = computePkceChallenge(codeVerifier);
    return timingSafeStringEqual(computed, codeChallenge);
  }

  return false;
}
