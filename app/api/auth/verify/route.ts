import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/lib/services/auth-service";

const verifySchema = z.object({
  sessionStateID: z.string().uuid(),
  otp: z.string().length(6).optional(),
  magicLinkToken: z.string().min(10).optional(),
});

const COOKIE_NAME = process.env.COOKIE_NAME || "savelo_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = verifySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!parsed.data.otp && !parsed.data.magicLinkToken) {
      return NextResponse.json(
        { error: "invalid_request", message: "Either 'otp' or 'magicLinkToken' must be provided." },
        { status: 400 }
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await authService.verifyAuth({
      sessionStateID: parsed.data.sessionStateID,
      otp: parsed.data.otp,
      magicLinkToken: parsed.data.magicLinkToken,
      ipAddress,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      authCode: result.authCode,
      redirectUri: result.redirectUri,
      state: result.state,
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
      },
    });

    // Set HTTP-Only Strict Session Cookie (BFF Pattern, SameSite=Lax per ADR-001)
    if (result.rawRefreshToken) {
      response.cookies.set({
        name: COOKIE_NAME,
        value: result.rawRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        domain: COOKIE_DOMAIN,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: unknown) {
    const err = error as Error;

    if (err.message === "IP_TEMPORARILY_BLOCKED") {
      return NextResponse.json(
        { error: "rate_limit_exceeded", message: "Too many verification failures. IP temporarily blocked." },
        { status: 429 }
      );
    }
    if (err.message === "MAX_ATTEMPTS_EXCEEDED") {
      return NextResponse.json(
        { error: "max_attempts_exceeded", message: "Maximum OTP attempts exceeded. Please initiate a new login." },
        { status: 400 }
      );
    }
    if (err.message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Invalid OTP or authentication token." },
        { status: 401 }
      );
    }
    if (err.message === "EXPIRED_OR_INVALID_SESSION") {
      return NextResponse.json(
        { error: "session_expired", message: "Authentication session expired or does not exist." },
        { status: 410 }
      );
    }

    console.error("[Auth Verify Error]:", err);
    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
