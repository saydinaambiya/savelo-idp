import { NextRequest, NextResponse } from "next/server";
import { oauthService } from "@/lib/services/oauth-service";
import { jwtVerify } from "jose";
import { getSigningKeys } from "@/lib/crypto/keys";
import { ISSUER } from "@/lib/crypto/jwt";

export async function GET(req: NextRequest) {
  return handleUserInfo(req);
}

export async function POST(req: NextRequest) {
  return handleUserInfo(req);
}

async function handleUserInfo(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "Missing or malformed Bearer token." },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
      }
    );
  }

  const token = authHeader.slice(7).trim();

  try {
    const { publicKey } = await getSigningKeys();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
    });

    const expectedAudience = Array.isArray(payload.aud) ? payload.aud[0] : (payload.aud as string);
    const userInfo = await oauthService.getUserInfo(token, expectedAudience);

    return NextResponse.json(userInfo, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("[UserInfo Error]:", error);
    return NextResponse.json(
      { error: "invalid_token", error_description: "Access token is invalid or expired." },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
      }
    );
  }
}
