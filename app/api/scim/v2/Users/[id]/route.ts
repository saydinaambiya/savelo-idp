import { NextRequest, NextResponse } from "next/server";
import { authenticateScimRequest } from "@/lib/auth/scim-auth";
import { scimService, type ScimPatchOperation } from "@/lib/services/scim-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * SCIM 2.0 /Users/{id} Individual Resource Endpoint (RFC 7644 Section 3.4 - 3.6)
 */
export async function GET(req: NextRequest, props: RouteProps) {
  const auth = await authenticateScimRequest();
  if (!auth.success) {
    const errorBody = scimService.createScimError(auth.status, auth.error);
    return NextResponse.json(errorBody, {
      status: auth.status,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  const { id } = await props.params;
  const user = await scimService.getUser(auth.client.clientId, id);

  if (!user) {
    const errorBody = scimService.createScimError(404, `User ${id} not found.`);
    return NextResponse.json(errorBody, {
      status: 404,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  return NextResponse.json(user, {
    status: 200,
    headers: { "Content-Type": "application/scim+json; charset=utf-8" },
  });
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  const auth = await authenticateScimRequest();
  if (!auth.success) {
    const errorBody = scimService.createScimError(auth.status, auth.error);
    return NextResponse.json(errorBody, {
      status: auth.status,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  const { id } = await props.params;

  try {
    const body = await req.json();
    const operations: ScimPatchOperation[] = body?.Operations || body?.operations || [];

    if (!Array.isArray(operations) || operations.length === 0) {
      const errorBody = scimService.createScimError(400, "Missing or empty Operations array in PatchOp.", "invalidSyntax");
      return NextResponse.json(errorBody, {
        status: 400,
        headers: { "Content-Type": "application/scim+json; charset=utf-8" },
      });
    }

    const updatedUser = await scimService.patchUser(auth.client.clientId, id, operations);

    if (!updatedUser) {
      const errorBody = scimService.createScimError(404, `User ${id} not found.`);
      return NextResponse.json(errorBody, {
        status: 404,
        headers: { "Content-Type": "application/scim+json; charset=utf-8" },
      });
    }

    return NextResponse.json(updatedUser, {
      status: 200,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  } catch (error) {
    console.error(`[SCIM] PATCH /Users/${id} error:`, error);
    const errorBody = scimService.createScimError(500, "Failed to apply SCIM patch operation.");
    return NextResponse.json(errorBody, {
      status: 500,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  const auth = await authenticateScimRequest();
  if (!auth.success) {
    const errorBody = scimService.createScimError(auth.status, auth.error);
    return NextResponse.json(errorBody, {
      status: auth.status,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }

  const { id } = await props.params;

  try {
    const deprovisioned = await scimService.deprovisionUser(auth.client.clientId, id);

    if (!deprovisioned) {
      const errorBody = scimService.createScimError(404, `User ${id} not found.`);
      return NextResponse.json(errorBody, {
        status: 404,
        headers: { "Content-Type": "application/scim+json; charset=utf-8" },
      });
    }

    // 204 No Content per RFC 7644 Section 3.6
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[SCIM] DELETE /Users/${id} error:`, error);
    const errorBody = scimService.createScimError(500, "Failed to deprovision user.");
    return NextResponse.json(errorBody, {
      status: 500,
      headers: { "Content-Type": "application/scim+json; charset=utf-8" },
    });
  }
}
