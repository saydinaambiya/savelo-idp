import { NextRequest, NextResponse } from "next/server";
import { oauthService } from "@/lib/services/oauth-service";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((val, key) => {
        body[key] = val;
      });
    } else {
      body = await req.json();
    }

    // Support HTTP Basic Authentication for client_id & client_secret
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      const credentials = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const [bId, bSecret] = credentials.split(":");
      if (bId) body.client_id = bId;
      if (bSecret) body.client_secret = bSecret;
    }

    const grantType = body.grant_type;
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (grantType === "authorization_code") {
      const code = body.code;
      const codeVerifier = body.code_verifier;
      const clientId = body.client_id;
      const clientSecret = body.client_secret;
      const redirectUri = body.redirect_uri;

      if (!code || !clientId) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "code and client_id are required." },
          { status: 400 }
        );
      }

      const tokenResponse = await oauthService.exchangeCode({
        code,
        codeVerifier,
        clientId,
        clientSecret,
        redirectUri,
        userAgent,
        ipAddress,
      });

      return NextResponse.json(tokenResponse, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    if (grantType === "refresh_token") {
      const refreshToken = body.refresh_token;
      const clientId = body.client_id;
      const clientSecret = body.client_secret;

      if (!refreshToken || !clientId) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "refresh_token and client_id are required." },
          { status: 400 }
        );
      }

      const tokenResponse = await oauthService.exchangeRefreshToken({
        refreshToken,
        clientId,
        clientSecret,
      });

      return NextResponse.json(tokenResponse, {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Only 'authorization_code' and 'refresh_token' are supported." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as Error;

    if (err.message === "TOKEN_THEFT_DETECTED") {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Token reuse detected. All sessions have been revoked." },
        { status: 400 }
      );
    }
    if (err.message === "INVALID_OR_EXPIRED_CODE" || err.message === "INVALID_REFRESH_TOKEN") {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid or expired token/code." },
        { status: 400 }
      );
    }
    if (err.message === "INVALID_CODE_VERIFIER" || err.message === "CODE_VERIFIER_REQUIRED") {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "PKCE verification failed." },
        { status: 400 }
      );
    }
    if (err.message === "CLIENT_MISMATCH" || err.message === "INVALID_CLIENT_SECRET" || err.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client authentication failed." },
        { status: 401 }
      );
    }
    if (err.message === "REDIRECT_URI_MISMATCH") {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "redirect_uri mismatch." },
        { status: 400 }
      );
    }

    console.error("[OAuth Token Error]:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error." },
      { status: 500 }
    );
  }
}
