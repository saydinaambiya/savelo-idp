import { prisma } from "../db/prisma";
import type { User } from "@prisma/client";

export const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
export const SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
export const SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error";
export const SCIM_PATCH_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp";

export interface ScimUserResource {
  schemas: string[];
  id: string;
  userName: string;
  name: {
    formatted?: string;
    givenName?: string;
    familyName?: string;
  };
  emails: Array<{
    value: string;
    type: string;
    primary: boolean;
  }>;
  phoneNumbers: Array<{
    value: string;
    type: string;
  }>;
  active: boolean;
  meta: {
    resourceType: "User";
    created: string;
    lastModified: string;
    location: string;
  };
}

export interface ScimListResponse {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: ScimUserResource[];
}

export interface ScimErrorResponse {
  schemas: string[];
  status: string;
  detail: string;
  scimType?: string;
}

export interface ScimPatchOperation {
  op: "add" | "replace" | "remove";
  path?: string;
  value?: unknown;
}

export class ScimService {
  /**
   * Serializes a Prisma User record into RFC 7643 SCIM User Resource format.
   */
  serializeScimUser(user: User, baseUrl = "/api/scim/v2"): ScimUserResource {
    const formattedName = [user.givenName, user.familyName].filter(Boolean).join(" ") || undefined;

    return {
      schemas: [SCIM_USER_SCHEMA],
      id: user.id,
      userName: user.email || user.phone || user.id,
      name: {
        formatted: formattedName,
        givenName: user.givenName || undefined,
        familyName: user.familyName || undefined,
      },
      emails: user.email
        ? [{ value: user.email, type: "work", primary: true }]
        : [],
      phoneNumbers: user.phone
        ? [{ value: user.phone, type: "work" }]
        : [],
      active: user.active,
      meta: {
        resourceType: "User",
        created: user.createdAt.toISOString(),
        lastModified: user.updatedAt.toISOString(),
        location: `${baseUrl}/Users/${user.id}`,
      },
    };
  }

  /**
   * Formats a standard SCIM error response per RFC 7644 section 3.12.
   */
  createScimError(status: number, detail: string, scimType?: string): ScimErrorResponse {
    return {
      schemas: [SCIM_ERROR_SCHEMA],
      status: String(status),
      detail,
      ...(scimType ? { scimType } : {}),
    };
  }

  /**
   * Lists users associated with a specific client, applying pagination and SCIM filtering.
   */
  async listUsers(options: {
    clientId: string;
    startIndex?: number;
    count?: number;
    filter?: string | null;
    baseUrl?: string;
  }): Promise<ScimListResponse> {
    const startIndex = Math.max(1, options.startIndex || 1);
    const count = Math.min(100, Math.max(1, options.count || 20));

    // Base query scoped strictly to caller client
    const whereClause: {
      clientUsers: { some: { clientId: string } };
      email?: { equals?: string; contains?: string; mode?: "insensitive" };
      active?: boolean;
    } = {
      clientUsers: {
        some: { clientId: options.clientId },
      },
    };

    // Basic SCIM filter parsing (e.g. userName eq "user@example.com", active eq true)
    if (options.filter) {
      const trimmed = options.filter.trim();
      const userNameMatch = trimmed.match(/userName\s+eq\s+["']([^"']+)["']/i);
      const activeMatch = trimmed.match(/active\s+eq\s+(true|false)/i);

      if (userNameMatch) {
        whereClause.email = {
          equals: userNameMatch[1].toLowerCase(),
          mode: "insensitive",
        };
      }

      if (activeMatch) {
        whereClause.active = activeMatch[1].toLowerCase() === "true";
      }
    }

    const [totalResults, users] = await prisma.$transaction([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: "asc" },
        skip: startIndex - 1,
        take: count,
      }),
    ]);

    const resources = users.map((user) => this.serializeScimUser(user, options.baseUrl));

    return {
      schemas: [SCIM_LIST_SCHEMA],
      totalResults,
      startIndex,
      itemsPerPage: resources.length,
      Resources: resources,
    };
  }

  /**
   * Retrieves a single user by ID, verifying tenant isolation.
   */
  async getUser(clientId: string, userId: string, baseUrl?: string): Promise<ScimUserResource | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        clientUsers: {
          some: { clientId },
        },
      },
    });

    if (!user) {
      return null;
    }

    return this.serializeScimUser(user, baseUrl);
  }

  /**
   * Provisions a new user under a specific client app.
   */
  async createUser(
    clientId: string,
    payload: {
      userName?: string;
      name?: { givenName?: string; familyName?: string };
      emails?: Array<{ value: string; primary?: boolean }>;
      phoneNumbers?: Array<{ value: string }>;
      active?: boolean;
    },
    baseUrl?: string
  ): Promise<{ user: ScimUserResource; created: boolean }> {
    const primaryEmail =
      payload.emails?.find((e) => e.primary)?.value ||
      payload.emails?.[0]?.value ||
      (payload.userName?.includes("@") ? payload.userName : undefined);

    const primaryPhone =
      payload.phoneNumbers?.[0]?.value ||
      (!payload.userName?.includes("@") ? payload.userName : undefined);

    const givenName = payload.name?.givenName;
    const familyName = payload.name?.familyName;
    const active = payload.active !== undefined ? Boolean(payload.active) : true;

    // Check if user already exists in global user registry
    let user = primaryEmail
      ? await prisma.user.findUnique({ where: { email: primaryEmail.toLowerCase().trim() } })
      : primaryPhone
      ? await prisma.user.findUnique({ where: { phone: primaryPhone.trim() } })
      : null;

    let created = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail ? primaryEmail.toLowerCase().trim() : null,
          phone: primaryPhone ? primaryPhone.trim() : null,
          givenName: givenName || null,
          familyName: familyName || null,
          active,
        },
      });
      created = true;
    } else {
      // Update existing user attributes if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          givenName: givenName !== undefined ? givenName : user.givenName,
          familyName: familyName !== undefined ? familyName : user.familyName,
          active: active !== undefined ? active : user.active,
        },
      });
    }

    // Link user to caller client
    await prisma.clientUser.upsert({
      where: {
        userId_clientId: {
          userId: user.id,
          clientId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        clientId,
        role: "member",
      },
    });

    return {
      user: this.serializeScimUser(user, baseUrl),
      created,
    };
  }

  /**
   * Performs partial updates on a user (e.g. deactivation / active: false) via RFC 7644 PatchOp.
   */
  async patchUser(
    clientId: string,
    userId: string,
    operations: ScimPatchOperation[],
    baseUrl?: string
  ): Promise<ScimUserResource | null> {
    // Verify client has access to this user
    const existing = await prisma.user.findFirst({
      where: {
        id: userId,
        clientUsers: {
          some: { clientId },
        },
      },
    });

    if (!existing) {
      return null;
    }

    const updates: {
      active?: boolean;
      givenName?: string;
      familyName?: string;
      email?: string;
    } = {};

    for (const op of operations) {
      if (op.op.toLowerCase() === "replace") {
        if (op.path?.toLowerCase() === "active") {
          updates.active = Boolean(op.value);
        } else if (op.path?.toLowerCase() === "name.givenname") {
          updates.givenName = String(op.value);
        } else if (op.path?.toLowerCase() === "name.familyname") {
          updates.familyName = String(op.value);
        } else if (typeof op.value === "object" && op.value !== null) {
          // Pathless replace object, e.g. { active: false }
          const valObj = op.value as Record<string, unknown>;
          if ("active" in valObj) {
            updates.active = Boolean(valObj.active);
          }
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // If deactivated, revoke active sessions for this client
    if (updates.active === false) {
      await prisma.session.deleteMany({
        where: {
          userId,
          clientId,
        },
      });
    }

    return this.serializeScimUser(updatedUser, baseUrl);
  }

  /**
   * Deprovisions (unlinks) a user from a specific client app.
   */
  async deprovisionUser(clientId: string, userId: string): Promise<boolean> {
    const clientUser = await prisma.clientUser.findUnique({
      where: {
        userId_clientId: {
          userId,
          clientId,
        },
      },
    });

    if (!clientUser) {
      return false;
    }

    await prisma.$transaction([
      prisma.clientUser.delete({
        where: {
          userId_clientId: {
            userId,
            clientId,
          },
        },
      }),
      prisma.session.deleteMany({
        where: {
          userId,
          clientId,
        },
      }),
    ]);

    return true;
  }
}

export const scimService = new ScimService();
