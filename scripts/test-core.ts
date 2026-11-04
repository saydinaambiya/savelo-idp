import {
  generateNumericOtp,
  generateSecureRandomToken,
  hashOtpWithPepper,
  timingSafeStringEqual,
} from "../lib/crypto/hash";
import { computePkceChallenge, verifyPkce } from "../lib/crypto/pkce";
import { signAccessToken, signIdToken, verifyJwt } from "../lib/crypto/jwt";
import { getPublicJwks } from "../lib/crypto/keys";

async function runTests() {
  console.log("=========================================");
  console.log("Running Savelo IdP Core Engineering Tests");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${title}`);
      process.exitCode = 1;
    }
  }

  // 1. CSPRNG OTP Generation
  const otp1 = generateNumericOtp(6);
  assert(otp1.length === 6 && /^\d{6}$/.test(otp1), "Generate 6-digit numeric OTP");

  // 2. HMAC-SHA256 OTP Hashing
  const hashedOtp1 = hashOtpWithPepper(otp1);
  const hashedOtp2 = hashOtpWithPepper(otp1);
  const hashedOtpDifferent = hashOtpWithPepper("000000");
  assert(
    hashedOtp1 === hashedOtp2 && hashedOtp1 !== hashedOtpDifferent,
    "HMAC-SHA256 OTP with pepper produces deterministic and unique hash"
  );

  // 3. Constant-Time String Comparison
  assert(timingSafeStringEqual(hashedOtp1, hashedOtp2), "Constant-time string comparison matches equal hashes");
  assert(!timingSafeStringEqual(hashedOtp1, hashedOtpDifferent), "Constant-time string comparison rejects unequal hashes");

  // 4. PKCE S256 Challenge & Verifier
  const verifier = generateSecureRandomToken(32);
  const challenge = computePkceChallenge(verifier);
  assert(verifyPkce(verifier, challenge, "S256"), "PKCE S256 verifier correctly matches challenge");
  assert(!verifyPkce("tampered-verifier", challenge, "S256"), "PKCE S256 rejects invalid verifier");

  // 5. RS256 JWT Token Issuance & Verification
  const claims = {
    sub: "user-uuid-12345",
    aud: "savelo-tools",
    email: "test@savelo.com",
  };

  const accessToken = await signAccessToken(claims, "15m");
  assert(typeof accessToken === "string" && accessToken.split(".").length === 3, "RS256 Access Token is valid 3-part JWT");

  const verifiedPayload = await verifyJwt(accessToken, "savelo-tools");
  assert(verifiedPayload.sub === "user-uuid-12345", "JWT verification resolves correct subject");
  assert(verifiedPayload.aud === "savelo-tools", "JWT audience matches intended client app");

  // 6. Cross-App Token Reuse Attack Prevention
  try {
    await verifyJwt(accessToken, "malicious-app-aud");
    assert(false, "Cross-app token reuse should be rejected");
  } catch {
    assert(true, "Cross-app token reuse prevented: audience mismatch rejected");
  }

  // 7. OIDC ID Token Issuance
  const idToken = await signIdToken(claims, "1h");
  assert(typeof idToken === "string" && idToken.split(".").length === 3, "RS256 ID Token is valid 3-part JWT");

  // 8. JWKS Public Key Export
  const jwks = await getPublicJwks();
  assert(
    Array.isArray(jwks.keys) && jwks.keys.length > 0 && jwks.keys[0].kty === "RSA",
    "JWKS export returns valid RSA public key"
  );

  console.log(`\n=========================================`);
  console.log(`Results: ${passed}/${total} tests passed!`);
  console.log("=========================================\n");
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
