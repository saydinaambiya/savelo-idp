import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/lib/services/auth-service";

const initiateSchema = z.object({
  identifier: z.string().min(3),
  client_id: z.string().min(1),
  redirect_uri: z.string().url().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
  state: z.string().optional(),
  scope: z.string().optional(),
  nonce: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = initiateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const result = await authService.initiateAuth({
      identifier: parsed.data.identifier,
      clientId: parsed.data.client_id,
      redirectUri: parsed.data.redirect_uri,
      codeChallenge: parsed.data.code_challenge,
      codeChallengeMethod: parsed.data.code_challenge_method,
      state: parsed.data.state,
      scope: parsed.data.scope,
      nonce: parsed.data.nonce,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      sessionStateID: result.sessionStateID,
      magicLinkUrl: result.magicLinkUrl,
      // rawOtp is returned only in non-production for testing/developer ergonomics
      ...(result.rawOtp ? { devOtp: result.rawOtp } : {}),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "rate_limit_exceeded", message: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
    if (err.message === "INVALID_CLIENT") {
      return NextResponse.json(
        { error: "invalid_client", message: "Client application not recognized." },
        { status: 400 }
      );
    }
    if (err.message === "INVALID_REDIRECT_URI") {
      return NextResponse.json(
        { error: "invalid_redirect_uri", message: "Redirect URI is not whitelisted." },
        { status: 400 }
      );
    }

    console.error("[Auth Initiate Error]:", err);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
