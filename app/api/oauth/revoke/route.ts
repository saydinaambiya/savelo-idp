import { NextRequest, NextResponse } from "next/server";
import { sessionRepository } from "@/lib/repositories/session-repository";

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

    const token = body.token;
    if (token) {
      const session = await sessionRepository.findByRefreshToken(token);
      if (session) {
        await sessionRepository.revokeSession(session.id);
      }
    }

    // RFC 7009: Revocation endpoint always returns 200 OK even if token is invalid
    return NextResponse.json({ status: "revoked" }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Token Revocation Error]:", error);
    return NextResponse.json({ status: "revoked" }, { status: 200 });
  }
}
