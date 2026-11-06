import crypto from "crypto";

const PEPPER =
  process.env.AUTH_PEPPER_SECRET ||
  process.env.OTP_PEPPER_SECRET ||
  "default-dev-pepper-secret-must-be-changed-in-production-32-chars";

/**
 * Computes HMAC-SHA256 of an OTP using a server-side pepper secret.
 * Mitigates rainbow table attacks against low-entropy 6-digit codes.
 */
export function hashOtpWithPepper(otp: string): string {
  return crypto.createHmac("sha256", PEPPER).update(otp.trim()).digest("hex");
}

/**
 * Computes standard SHA-256 hash for high-entropy tokens (Magic Link, Refresh Token, Secrets).
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Performs a constant-time comparison of two strings using crypto.timingSafeEqual.
 * Converts strings to fixed-length SHA-256 digests before comparing to prevent timing leaks on string lengths.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Generates a cryptographically secure random hex token.
 */
export function generateSecureRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generates a cryptographically secure numeric OTP using CSPRNG.
 */
export function generateNumericOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  // Generate random integer in range [0, max - 1]
  const randomInt = crypto.randomInt(0, max);
  return randomInt.toString().padStart(digits, "0");
}
