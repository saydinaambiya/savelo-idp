import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/crypto/hash";

async function main() {
  console.log("Seeding Savelo ecosystem client applications...");

  const clients = [
    {
      name: "Savelo Tools",
      clientId: "savelo-tools",
      rawSecret: "savelo-tools-secret-key-12345",
      scimToken: "savelo-tools-scim-token-secret-12345",
      redirectUris: [
        "http://localhost:3000/callback",
        "https://tools.savelo.web.id/api/auth/callback",
      ],
    },
    {
      name: "Savetable",
      clientId: "savetable",
      rawSecret: "savetable-secret-key-12345",
      scimToken: "savetable-scim-token-secret-12345",
      redirectUris: [
        "http://localhost:3000/callback",
        "https://table.savelo.web.id/api/auth/callback",
      ],
    },
    {
      name: "Saveroute",
      clientId: "saveroute",
      rawSecret: "saveroute-secret-key-12345",
      scimToken: "saveroute-scim-token-secret-12345",
      redirectUris: [
        "http://localhost:3000/callback",
        "https://route.savelo.web.id/api/auth/callback",
      ],
    },
  ];

  for (const client of clients) {
    const hashedSecret = hashToken(client.rawSecret);
    const hashedScimToken = hashToken(client.scimToken);

    const result = await prisma.clientApp.upsert({
      where: { clientId: client.clientId },
      update: {
        name: client.name,
        clientSecret: hashedSecret,
        scimToken: hashedScimToken,
        redirectUris: client.redirectUris,
      },
      create: {
        name: client.name,
        clientId: client.clientId,
        clientSecret: hashedSecret,
        scimToken: hashedScimToken,
        redirectUris: client.redirectUris,
      },
    });

    console.log(`✓ Seeded client: ${result.name} (${result.clientId}) with SCIM token`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
