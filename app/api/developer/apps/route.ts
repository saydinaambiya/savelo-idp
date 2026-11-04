import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { clientRepository } from "@/lib/repositories/client-repository";

const createClientSchema = z.object({
  name: z.string().min(2, "App name must be at least 2 characters").max(60),
  redirectUris: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one redirect URI is required")
    .refine(
      (uris) =>
        uris.every((uri) => {
          try {
            const url = new URL(uri);
            // Allow localhost/127.0.0.1 for local development, enforce HTTPS for production domains
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
              return true;
            }
            return url.protocol === "https:";
          } catch {
            return false;
          }
        }),
      {
        message: "Production redirect URIs must use HTTPS. HTTP is only permitted on localhost.",
      }
    ),
});

export async function GET() {
  try {
    const clients = await clientRepository.listAll();
    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("[Developer Apps API] Error listing clients:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "Failed to retrieve registered applications." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: parsed.error.issues[0]?.message || "Invalid application payload.",
        },
        { status: 400 }
      );
    }

    const { name, redirectUris } = parsed.data;

    // Generate random client credentials
    const slugName = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 16);
    const randomHex = crypto.randomBytes(6).toString("hex");
    const clientId = `${slugName}-${randomHex}`;
    const rawSecret = `savelo_sec_${crypto.randomBytes(24).toString("hex")}`;

    const client = await clientRepository.createClient({
      name,
      clientId,
      rawSecret,
      redirectUris,
    });

    return NextResponse.json(
      {
        success: true,
        client: {
          id: client.id,
          name: client.name,
          clientId: client.clientId,
          redirectUris: client.redirectUris,
          createdAt: client.createdAt,
        },
        plainSecret: rawSecret, // Returned exclusively once upon creation
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Developer Apps API] Error creating client:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "Failed to register new application." },
      { status: 500 }
    );
  }
}
