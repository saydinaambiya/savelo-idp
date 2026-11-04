import { NextResponse } from "next/server";
import { ISSUER } from "@/lib/crypto/jwt";

export async function GET() {
  const config = {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/api/oauth/token`,
    userinfo_endpoint: `${ISSUER}/api/oauth/userinfo`,
    jwks_uri: `${ISSUER}/api/.well-known/jwks.json`,
    revocation_endpoint: `${ISSUER}/api/oauth/revoke`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email", "phone"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "email_verified", "phone"],
    code_challenge_methods_supported: ["S256"],
  };

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
