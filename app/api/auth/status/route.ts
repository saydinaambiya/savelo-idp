import { NextRequest, NextResponse } from "next/server";
import { eventService, type AuthSyncEvent } from "@/lib/services/event-service";
import { authStateRepository } from "@/lib/repositories/auth-state-repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionStateID = searchParams.get("session_state_id");

  if (!sessionStateID) {
    return NextResponse.json(
      { error: "invalid_request", message: "session_state_id is required." },
      { status: 400 }
    );
  }

  // Check if session exists in Redis
  const state = await authStateRepository.getAuthRequest(sessionStateID);
  if (!state) {
    return NextResponse.json(
      { error: "session_not_found", message: "Session expired or invalid." },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial handshake comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      // 2. If already verified, send immediately
      if (state.isVerified && state.authCode) {
        const payload: AuthSyncEvent = {
          status: "verified",
          authCode: state.authCode,
          redirectUri: state.redirectUri,
          state: state.state,
        };
        controller.enqueue(
          encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`)
        );
        controller.close();
        return;
      }

      // 3. Keep-alive heartbeat interval (every 15s)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // 4. Subscribe to Redis Pub/Sub channel
      const unsubscribe = eventService.subscribeToAuthEvent(
        sessionStateID,
        (event: AuthSyncEvent) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: message\ndata: ${JSON.stringify(event)}\n\n`
              )
            );
            if (event.status === "verified" || event.status === "rejected") {
              clearInterval(heartbeat);
              unsubscribe();
              controller.close();
            }
          } catch {
            clearInterval(heartbeat);
            unsubscribe();
          }
        }
      );

      // 5. Automatic timeout after 10 minutes (matching TTL)
      const timeout = setTimeout(() => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.enqueue(
            encoder.encode(
              `event: message\ndata: ${JSON.stringify({ status: "expired" })}\n\n`
            )
          );
          controller.close();
        } catch {}
      }, 600000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearTimeout(timeout);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
