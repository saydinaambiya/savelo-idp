# Architecture Design Document: Savelo Centralized Identity Provider (IdP)

## 1. Architecture Overview & Objectives

This system is designed as a Centralized Identity Provider (IdP) with global standards to serve a multi-application ecosystem (e.g., Savelo, Savetable, Saveroute, and future applications). The architecture adopts a **Zero Password Management** principle using a combination of **Magic Link** and **One-Time Password (OTP)** authentication. Interactions between the IdP and Client Applications are governed by OAuth 2.0 and OpenID Connect (OIDC) standards using the **Authorization Code with PKCE** flow.

## 2. Technology Stack & Standards

* **Core Framework:** Next.js 14 (App Router) & TypeScript.

* **Database & ORM:** PostgreSQL integrated with Prisma ORM.

* **State & Rate Limiting:** Redis.

* **Cryptography:** RS256 (Asymmetric JWT Signature), SHA-256 (Hashing), CSPRNG (Token Generation).

* **Security Protocols:** OAuth 2.0, OIDC, PKCE, HTTP-Only Cookies (BFF Pattern).

## 3. Database Architecture (Prisma Schema)

This schema separates global user entities, application identities (Clients), active sessions, and a temporary state machine for the authentication process.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String?   @unique
  phone         String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}

model ClientApp {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String        // e.g., "Savelo Tools", "Saveroute"
  clientId        String        @unique 
  clientSecret    String        // Hashed
  redirectUris    String[]      // Callback URLs whitelist
  sessions        Session[]
}

// Note: Ephemeral AuthRequest state & PKCE are stored in Redis (see ADR-001)

model Session {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String    @db.Uuid
  clientId     String
  familyId     String    @db.Uuid // Token Family identifier for Refresh Token Rotation
  refreshToken String    @unique // Hashed refresh token
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  client       ClientApp @relation(fields: [clientId], references: [clientId])
  
  @@index([userId])
  @@index([familyId])
}
```

## 4. Authentication Flow (Magic Link & OTP)

### A. Initiation & State Creation (`POST /api/auth/initiate`)

1. **Client Application** sends the `client_id`, `redirect_uri`, `identifier` (email/phone), and `state` (PKCE) parameters.

2. **Auth Server** generates a 6-digit OTP and a 32-byte cryptographically secure random token.

3. Both values are hashed (SHA-256) and saved in the `AuthRequest` table under the same `sessionStateID` (UUID).

4. The authentication payload is dispatched to the user. The API responds with the `sessionStateID` to the initiating Client.

### B. Cross-Device Synchronization & Email Scanner Evasion

1. **Email Scanner Protection:** The Magic Link must NOT trigger validation via HTTP GET. The link redirects to a static interface with a "Confirm Login" button that executes an HTTP POST.

2. **Cross-Device UX:** The initiating device uses the `sessionStateID` to open a Server-Sent Events (SSE) connection or HTTP polling to `/api/auth/status`. When the user confirms via a different device (e.g., mobile), the `isVerified` status is updated to `true`. The Auth Server then responds to the SSE connection with the Authorization Code to the initiating device.

### C. Execution & Token Issuance (`POST /api/auth/verify`)

1. Validation compares the input against the `tokenHash` using time-constant comparison (`crypto.timingSafeEqual`).

2. If OTP fails > 3 times (`attempts`), the record is deleted.

3. If successful, the Auth Server performs auto-provisioning (if the User does not exist), logs the `Session`, and issues an `Authorization Code`.

## 5. Token Architecture & Cross-App Isolation

Authentication yields a JSON Web Token (JWT) with asymmetric signatures (RS256). The private key remains strictly on the Auth Server, while Client Apps fetch the public key from `/.well-known/jwks.json`.

**JWT Payload Structure:**

```json
{
  "iss": "https://auth.savelo.web.id",
  "sub": "uuid-user-123",
  "aud": "client_id_target_app",
  "exp": 1730700000,
  "jti": "uuid-unique-token-id"
}
```

*Isolation mechanism:* A Client App will reject the JWT if the `aud` (Audience) claim does not match its own `client_id`, definitively preventing cross-app token reuse attacks within the ecosystem.

## 6. Frontend Security (Backend-for-Frontend)

1. **No LocalStorage:** Storing access or refresh tokens in `localStorage` or `sessionStorage` is strictly prohibited to prevent token extraction via XSS attacks.

2. **Strict Cookies:** All tokens are managed by Next.js Route Handlers (Server) and transmitted to the browser exclusively using cookies labeled `HttpOnly=true`, `Secure=true`, and `SameSite=Strict`.

3. **Refresh Token Rotation (RTR):** Every refresh token exchange generates a new token. If an old/used token is submitted, the system detects a token theft event and executes a **Revoke Token Family** protocol (terminating all associated user sessions).

## 7. Infrastructure Security Layer

1. **Redis Token Bucket Rate Limiting:**

   * Initiation: Max 3-5 requests / 15 minutes per IP & Identifier combination.

   * Verification: Max 5 OTP failures / 1 hour per IP (mitigating SMS Toll Fraud & Brute Force).

2. **Anti-Enumeration WAF:** The `/api/auth/initiate` API response enforces a constant latency (time-constant) regardless of user existence in the database.

3. **Impossible Travel Detection:** Real-time evaluation of `Session` metadata (IP Address, User-Agent) to automatically block illogical geographical transitions.

4. **Zero Trust VPC:** The PostgreSQL instance has zero public network routes. Database communication is exclusively permitted through the internal compute instances of the Auth Server.

## ⚠️ CRITICAL DIRECTIVES FOR AI ENGINEERING AGENT

**ATTENTION AI AGENT:** By reading this document, you are bound to the following strict architectural constraints set by the Principal Architect.

1. **ABSOLUTE COMPLIANCE:** You must build the system exactly as specified in this document. Do not deviate from the established protocols, database schemas, or security flows.

2. **NO UNAPPROVED IMPROVEMENTS:** Do not "improve" the system by adding new requirements, libraries, or features that are not explicitly stated in this design (e.g., do not add alternative login methods, do not change the hashing algorithms, do not move tokens to LocalStorage).

3. **STRICT SECURITY PROTOCOLS:** The security layers (BFF, HTTP-Only Cookies, JWT with RS256, Refresh Token Rotation, Time-Constant Comparison) are non-negotiable. Do not attempt to simplify them for the sake of development speed.

4. **CHANGE MANAGEMENT:** You must strictly follow this blueprint UNLESS the user explicitly commands a change. If a user requests a change that contradicts this document, you MUST first analyze and warn the user about the architectural and security impacts of that decision before proceeding.

5. **EXECUTION MANDATE:** Act strictly as the implementer of this blueprint. Your goal is execution with precision, not re-architecture.

6. **CODE QUALITY STANDARDS:** All generated code MUST be highly readable, maintainable, and scalable. You must strictly adhere to global best practices, clean code principles, and the highest security standards in software engineering when writing the actual implementation.

---

## 8. Architectural Decision Record (ADR-001): Clarifications & Refinements

**Status:** Approved by Principal Architect (2026-11-04)

1. **Framework Version (Next.js 16 + React 19):**
   * Approved to proceed with Next.js 16 and React 19 (using modern App Router Route Handlers `/app/api/...`, async server APIs, and Server Actions/Components) while adhering to the core BFF security principles.

2. **OTP & Magic Link Cryptography (HMAC-SHA256 & Split State):**
   * OTP 6-digit hashing uses **HMAC-SHA256** with a server-side pepper/secret (`AUTH_PEPPER_SECRET`) to prevent rainbow table attacks.
   * State storage splits OTP hash and Magic Link token hash into distinct keys/fields to preserve the integrity of the state machine.

3. **PKCE & Authorization Code Transient Storage in Redis:**
   * PKCE parameters (`code_challenge`, `code_challenge_method`, `redirect_uri`) are tied to the `sessionStateID` in Redis.
   * Short-lived `authorization_code` (1-3 min TTL) is stored in Redis mapped to `client_id`, `user_id`, `redirect_uri`, and `code_challenge` for exchange at `/api/oauth/token`.

4. **Refresh Token Rotation (RTR) Token Family in PostgreSQL:**
   * A `familyId` (UUID) column is added to the `Session` model in PostgreSQL.
   * On detection of reused refresh tokens, all sessions belonging to the same `familyId` are immediately revoked (`DELETE FROM "Session" WHERE "familyId" = ...`).

5. **AuthRequest Ephemeral State Migration to Redis:**
   * `AuthRequest` is removed from PostgreSQL schema and fully managed in Redis with automatic TTL expiration (10 min).
   * Cross-device synchronization uses Redis Pub/Sub to push events to the initiating device's SSE connection (`/api/auth/status`).

6. **Cookie SameSite Policy (SameSite=Lax):**
   * OAuth 2.0 / OIDC redirects across subdomains/domains require `SameSite=Lax` for top-level navigation token/session preservation, with `HttpOnly=true` and `Secure=true` strictly enforced.

7. **Iconography & UI Design Standards (Zero Emoji Policy):**
   * **STRICT PROHIBITION:** Emojis (e.g. 🔐, ➔, ↗, ⚠️, etc.) must NEVER be used as UI icons or functional visual elements across user-facing pages, alerts, or buttons.
   * **STANDARDIZED ICONOGRAPHY:** All interfaces must use professional, bold, simple, and elegant vector icons (using standard icon libraries like `lucide-react` or clean SVG).
   * **AESTHETIC CRITERIA:** Icons must adhere to minimal, clean, enterprise-grade fintech/identity standards with crisp strokes (stroke-width: 2px or 2.5px), consistent sizing (16px to 24px), and muted contextual tones.