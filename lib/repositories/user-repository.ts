import { prisma } from "../db/prisma";
import type { User } from "@prisma/client";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const isEmail = identifier.includes("@");

    if (isEmail) {
      return prisma.user.findUnique({
        where: { email: identifier.toLowerCase().trim() },
      });
    }

    return prisma.user.findUnique({
      where: { phone: identifier.trim() },
    });
  }

  /**
   * Auto-provisions user on successful first-time authentication.
   */
  async autoProvision(identifier: string): Promise<User> {
    const isEmail = identifier.includes("@");
    const normalized = identifier.trim();

    const existing = await this.findByIdentifier(normalized);
    if (existing) {
      return existing;
    }

    if (isEmail) {
      return prisma.user.create({
        data: {
          email: normalized.toLowerCase(),
        },
      });
    }

    return prisma.user.create({
      data: {
        phone: normalized,
      },
    });
  }
}

export const userRepository = new UserRepository();
