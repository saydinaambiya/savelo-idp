import { prisma } from "../db/prisma";
import { hashToken } from "../crypto/hash";
import crypto from "crypto";
import type { Session } from "@prisma/client";

export class SessionRepository {
  /**
   * Creates a new user session with a unique familyId.
   */
  async createSession(data: {
    userId: string;
    clientId: string;
    rawRefreshToken: string;
    familyId?: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<{ session: Session; rawRefreshToken: string; familyId: string }> {
    const familyId = data.familyId || crypto.randomUUID();
    const hashedToken = hashToken(data.rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + (data.expiresInDays || 30) * 24 * 60 * 60 * 1000
    );

    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        clientId: data.clientId,
        familyId,
        refreshToken: hashedToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt,
      },
    });

    return { session, rawRefreshToken: data.rawRefreshToken, familyId };
  }

  /**
   * Finds an active session by the raw refresh token hash.
   */
  async findByRefreshToken(rawRefreshToken: string): Promise<Session | null> {
    const hashed = hashToken(rawRefreshToken);
    return prisma.session.findUnique({
      where: { refreshToken: hashed },
      include: { user: true, client: true },
    });
  }

  /**
   * Rotates a session with a new refresh token while preserving the familyId.
   */
  async rotateToken(
    sessionId: string,
    newRawRefreshToken: string,
    expiresInDays = 30
  ): Promise<Session> {
    const hashed = hashToken(newRawRefreshToken);
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    );

    return prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: hashed,
        expiresAt,
      },
    });
  }

  /**
   * Revokes all sessions belonging to a specific Token Family (breach detection).
   */
  async revokeFamily(familyId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { familyId },
    });
    return result.count;
  }

  /**
   * Revokes a single session by its ID.
   */
  async revokeSession(sessionId: string): Promise<Session | null> {
    try {
      return await prisma.session.delete({
        where: { id: sessionId },
      });
    } catch {
      return null;
    }
  }

  /**
   * Revokes all sessions for a specific user.
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}

export const sessionRepository = new SessionRepository();
