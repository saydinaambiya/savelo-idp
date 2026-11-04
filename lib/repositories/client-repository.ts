import { prisma } from "../db/prisma";
import { hashToken, timingSafeStringEqual } from "../crypto/hash";
import type { ClientApp } from "@prisma/client";

export class ClientRepository {
  async findByClientId(clientId: string): Promise<ClientApp | null> {
    return prisma.clientApp.findUnique({
      where: { clientId },
    });
  }

  /**
   * Verifies if client redirect URI matches the whitelist in database.
   */
  validateRedirectUri(client: ClientApp, redirectUri: string): boolean {
    return client.redirectUris.includes(redirectUri);
  }

  /**
   * Validates client_secret using time-constant comparison.
   */
  validateClientSecret(client: ClientApp, secret: string): boolean {
    const hashedProvided = hashToken(secret);
    return timingSafeStringEqual(hashedProvided, client.clientSecret);
  }

  /**
   * Register or upsert a client app (useful for setup/seeding).
   */
  async upsertClient(data: {
    name: string;
    clientId: string;
    rawSecret: string;
    redirectUris: string[];
  }): Promise<ClientApp> {
    const hashedSecret = hashToken(data.rawSecret);

    return prisma.clientApp.upsert({
      where: { clientId: data.clientId },
      update: {
        name: data.name,
        clientSecret: hashedSecret,
        redirectUris: data.redirectUris,
      },
      create: {
        name: data.name,
        clientId: data.clientId,
        clientSecret: hashedSecret,
        redirectUris: data.redirectUris,
      },
    });
  }
}

export const clientRepository = new ClientRepository();
