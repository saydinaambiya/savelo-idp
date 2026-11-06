import { headers } from "next/headers";
import { prisma } from "../db/prisma";
import { hashToken } from "../crypto/hash";
import type { ClientApp } from "@prisma/client";

export type ScimAuthResult =
  | { success: true; client: ClientApp }
  | { success: false; error: string; status: number };

/**
 * Validates the SCIM Bearer token from the HTTP Authorization header.
 * Enforces server-to-server authentication and returns the corresponding ClientApp.
 */
export async function authenticateScimRequest(customHeader?: string | null): Promise<ScimAuthResult> {
  let authHeader = customHeader;

  if (authHeader === undefined) {
    const headersList = await headers();
    authHeader = headersList.get("authorization");
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or malformed Authorization header. Expected Bearer token.",
      status: 401,
    };
  }

  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!rawToken) {
    return {
      success: false,
      error: "Empty Bearer token provided.",
      status: 401,
    };
  }

  // Lookup client by SHA-256 hashed SCIM token
  const hashedToken = hashToken(rawToken);
  const client = await prisma.clientApp.findFirst({
    where: { scimToken: hashedToken },
  });

  if (!client) {
    return {
      success: false,
      error: "Invalid or unauthorized SCIM Bearer token.",
      status: 401,
    };
  }

  return {
    success: true,
    client,
  };
}
