import { NextRequest, NextResponse } from "next/server";
import { authenticateScimRequest } from "@/lib/auth/scim-auth";
import { scimService } from "@/lib/services/scim-service";

/**
 * SCIM 2.0 /Users Endpoint (RFC 7644 Section 3.2 & 3.3)
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateScimRequest();
  if (!auth.success) {
    const errorBody = scimService.createScimError(auth.status, auth.error);
    return NextResponse.json(errorBody, {
      status: auth.status,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  const { searchParams } = new URL(req.url);
  const startIndex = parseInt(searchParams.get("startIndex") || "1", 10);
  const count = parseInt(searchParams.get("count") || "20", 10);
  const filter = searchParams.get("filter");

  try {
    const result = await scimService.listUsers({
      clientId: auth.client.clientId,
      startIndex,
      count,
      filter,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  } catch (error) {
    console.error("[SCIM] GET /Users error:", error);
    const errorBody = scimService.createScimError(500, "Internal server error occurred.");
    return NextResponse.json(errorBody, {
      status: 500,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateScimRequest();
  if (!auth.success) {
    const errorBody = scimService.createScimError(auth.status, auth.error);
    return NextResponse.json(errorBody, {
      status: auth.status,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      const errorBody = scimService.createScimError(400, "Invalid JSON payload provided.", "invalidSyntax");
      return NextResponse.json(errorBody, {
        status: 400,
        headers: { "Content-Type": "application/scim+json; charset=utf-8" },
      });
    }

    const { user, created } = await scimService.createUser(auth.client.clientId, body);

    return NextResponse.json(user, {
      status: created ? 201 : 200,
      headers: {
        "Content-Type": "application/scim+json; charset=utf-8",
        Location: user.meta.location,
      },
    });
  } catch (error) {
    console.error("[SCIM] POST /Users error:", error);
    const errorBody = scimService.createScimError(500, "Failed to provision SCIM user.");
    return NextResponse.json(errorBody, {
      status: 500,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }
}
