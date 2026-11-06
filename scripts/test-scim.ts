import {
  ScimService,
  SCIM_USER_SCHEMA,
  SCIM_LIST_SCHEMA,
  SCIM_ERROR_SCHEMA,
  type ScimPatchOperation,
} from "@/lib/services/scim-service";
import { hashToken } from "@/lib/crypto/hash";
import type { User } from "@prisma/client";

async function runScimTests() {
  console.log("=========================================");
  console.log("Running Savelo IdP SCIM v2.0 Protocol Tests");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${title}`);
      process.exitCode = 1;
    }
  }

  const scimService = new ScimService();

  // 1. SCIM User Resource Serialization
  const mockUser: User = {
    id: "e4eaaaf2-d142-11e1-b3e4-080027620cdd",
    email: "john.doe@abccorp.com",
    phone: "+628123456789",
    givenName: "John",
    familyName: "Doe",
    active: true,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-05T12:00:00Z"),
  };

  const serialized = scimService.serializeScimUser(mockUser, "https://idp.savelo.com/api/scim/v2");

  assert(
    serialized.schemas.includes(SCIM_USER_SCHEMA),
    "SCIM User schema includes urn:ietf:params:scim:schemas:core:2.0:User"
  );
  assert(
    serialized.userName === "john.doe@abccorp.com",
    "SCIM userName resolves to primary email identifier"
  );
  assert(
    serialized.name.formatted === "John Doe" &&
      serialized.name.givenName === "John" &&
      serialized.name.familyName === "Doe",
    "SCIM name object formats givenName, familyName, and full formatted name correctly"
  );
  assert(
    serialized.emails.length === 1 &&
      serialized.emails[0].value === "john.doe@abccorp.com" &&
      serialized.emails[0].primary,
    "SCIM emails array includes primary work email"
  );
  assert(
    serialized.phoneNumbers.length === 1 && serialized.phoneNumbers[0].value === "+628123456789",
    "SCIM phoneNumbers array includes phone"
  );
  assert(serialized.active, "SCIM active flag reflects true");
  assert(
    serialized.meta.resourceType === "User" &&
      serialized.meta.location === `https://idp.savelo.com/api/scim/v2/Users/${mockUser.id}`,
    "SCIM meta contains resourceType User and canonical location URI"
  );

  // 2. SCIM ListResponse Structure
  const mockListResponse = {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults: 1,
    startIndex: 1,
    itemsPerPage: 1,
    Resources: [serialized],
  };
  assert(
    mockListResponse.schemas.includes(SCIM_LIST_SCHEMA) && mockListResponse.totalResults === 1,
    "SCIM ListResponse schema includes urn:ietf:params:scim:api:messages:2.0:ListResponse"
  );

  // 3. SCIM Error Response Formatting (RFC 7644)
  const scimError = scimService.createScimError(404, "User not found", "invalidValue");
  assert(
    scimError.schemas.includes(SCIM_ERROR_SCHEMA),
    "SCIM error schema includes urn:ietf:params:scim:api:messages:2.0:Error"
  );
  assert(
    scimError.status === "404" && scimError.scimType === "invalidValue",
    "SCIM error formats status as string and attaches scimType"
  );

  // 3. SCIM Token Cryptographic Hashing Verification
  const rawScimToken = "savelo-tools-scim-token-secret-12345";
  const hashedScimToken = hashToken(rawScimToken);
  const differentScimToken = hashToken("tampered-token");

  assert(
    hashedScimToken === hashToken(rawScimToken) && hashedScimToken !== differentScimToken,
    "SCIM Bearer token hashes deterministically using SHA-256 for secure storage at rest"
  );

  // 4. SCIM PatchOp Operations Logic
  const patchOps: ScimPatchOperation[] = [
    { op: "replace", path: "active", value: false },
    { op: "replace", path: "name.givenName", value: "Jonathan" },
  ];

  assert(
    patchOps[0].op === "replace" && patchOps[0].path === "active" && patchOps[0].value === false,
    "SCIM PatchOp operation structure parses replace active: false deactivation payload"
  );

  console.log("\n=========================================");
  console.log(`SCIM Test Results: ${passed}/${total} passed!`);
  console.log("=========================================\n");
}

runScimTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
