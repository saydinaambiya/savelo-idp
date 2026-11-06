# Savelo IdP Centralized Documentation Hub

> **Central Reference for AI Agents & Engineers**  
> *Read this hub before exploring individual source files. This documentation provides a comprehensive, authoritative map of the Savelo Identity Provider (IdP) repository, enabling rapid, targeted development without requiring full codebase scans.*

---

## 1. System Overview

**Savelo IdP** (`savelo-idp`) is a centralized, enterprise-grade Identity Provider and OpenID Connect (OIDC) / OAuth 2.0 authorization server engineered to serve multi-application ecosystems (including Savelo Tools, Savetable, Saveroute, and external client applications).

### Architectural Foundations:
- **Zero-Password Authentication:** Eliminates static passwords entirely in favor of cryptographic 6-digit numeric One-Time Passwords (OTP) and high-entropy Magic Links.
- **OAuth 2.0 & OpenID Connect (OIDC):** Full compliance with RFC 6749, RFC 7636 (PKCE with SHA-256), and OIDC Core specifications.
- **Backend-for-Frontend (BFF) Security:** No access or refresh tokens are ever stored in browser `localStorage` or `sessionStorage`. All tokens are transmitted via `HttpOnly`, `Secure`, `SameSite=Lax` cookies or direct back-channel server-to-server exchanges.
- **Refresh Token Rotation (RTR) & Token Family Revocation:** Every refresh token exchange yields a new refresh token. Replay of an invalidated token triggers an immediate breach revocation protocol, invalidating all sessions in that token family.
- **Anti-Enumeration Protections:** Constant-latency execution loops on authentication initiation prevent timing attacks that expose user registration status.
- **Asymmetric RS256 JWTs:** Access and ID tokens are cryptographically signed with private RSA keys and verified by client applications via public keys published at `/.well-known/jwks.json`.

---

## 2. Agent Quick Reference (Where to Look)

When assigned a task, consult the table below to identify the exact files and docs relevant to your scope:

| Scope of Task | Relevant Docs | Key Code Locations |
| :--- | :--- | :--- |
| **Authentication Logic (OTP, Magic Link, Anti-Enumeration)** | [`docs/flows/authentication.md`](./flows/authentication.md)<br>[`docs/architecture/security-and-crypto.md`](./architecture/security-and-crypto.md) | `lib/services/auth-service.ts`<br>`lib/crypto/hash.ts`<br>`lib/utils/anti-enumeration.ts`<br>`app/api/auth/*` |
| **OAuth 2.0, Tokens, Sessions & RTR** | [`docs/flows/oauth-oidc.md`](./flows/oauth-oidc.md)<br>[`docs/architecture/security-and-crypto.md`](./architecture/security-and-crypto.md) | `lib/services/oauth-service.ts`<br>`lib/crypto/jwt.ts`<br>`lib/crypto/pkce.ts`<br>`lib/repositories/session-repository.ts`<br>`app/api/oauth/*` |
| **Database Models & Ephemeral State** | [`docs/database/schema-and-state.md`](./database/schema-and-state.md) | `prisma/schema.prisma`<br>`lib/db/prisma.ts`<br>`lib/repositories/auth-state-repository.ts`<br>`lib/redis/redis.ts` |
| **API Endpoints & Contracts** | [`docs/api/reference.md`](./api/reference.md) | `app/api/**/route.ts` |
| **Frontend UI, Theming & Iconography** | [`docs/architecture/overview.md`](./architecture/overview.md)<br>[`AGENTS.md`](../AGENTS.md) | `app/page.tsx`<br>`app/console/page.tsx`<br>`app/oauth/authorize/page.tsx`<br>`app/verify/page.tsx`<br>`components/*` |
| **Local Setup, Docker, Scripts & Testing** | [`docs/development/setup-and-workflow.md`](./development/setup-and-workflow.md) | `docker-compose.yml`<br>`scripts/*`<br>`package.json` |
| **CI/CD, PRs & Vercel Deployments** | [`docs/development/cicd.md`](./development/cicd.md) | `.github/workflows/*`<br>`scripts/vercel-ignore-build.sh`<br>`vercel.json` |
| **Versioning, Commits & Changelog** | [`docs/development/versioning.md`](./development/versioning.md) | `CHANGELOG.md`<br>`package.json` |

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router with Route Handlers and Server Components) & React 19.
- **Language & Runtime:** TypeScript 5 (Strict mode) on Node.js 20+.
- **Database & ORM:** PostgreSQL 16+ managed via Prisma ORM (`@prisma/client` 6.x).
- **State & Caching:** Redis 7+ via `ioredis` with serverless connection reuse.
- **Cryptography:** Node.js native `crypto` & `jose` library (RS256, HMAC-SHA256, SHA-256 PKCE).
- **Styling & UI:** Tailwind CSS v4, Lucide React (vector iconography only), custom monochromatic dark/light theme.
- **Quality Gate:** ESLint 9, `tsc --noEmit`, automated test suite via `tsx scripts/test-core.ts`.

---

## 4. Repository Directory Structure

```
savelo-idp/
├── app/                                # Next.js App Router
│   ├── .well-known/
│   │   ├── jwks.json/route.ts          # Public RSA JWKS keys
│   │   └── openid-configuration/route.ts # OIDC discovery document
│   ├── api/
│   │   ├── auth/
│   │   │   ├── initiate/route.ts       # OTP & Magic Link trigger
│   │   │   ├── verify/route.ts         # OTP/Magic token validation
│   │   │   └── status/route.ts         # SSE cross-device status sync
│   │   ├── developer/apps/route.ts     # Client app registration
│   │   └── oauth/
│   │       ├── revoke/route.ts         # Session/family revocation
│   │       ├── token/route.ts          # Code exchange & RTR
│   │       └── userinfo/route.ts       # Profile claims
│   ├── console/page.tsx                # Developer Console & PKCE Sandbox
│   ├── docs/page.tsx                   # In-app integration docs
│   ├── oauth/authorize/page.tsx        # Login & Consent UI
│   ├── verify/page.tsx                 # Magic Link confirmation UI
│   ├── globals.css                     # Tailwind CSS & theme tokens
│   ├── layout.tsx                      # Root layout & theme provider
│   └── page.tsx                        # Public landing page
├── components/                         # Shared UI Components
│   ├── footer.tsx                      # Enterprise footer
│   ├── navbar.tsx                      # Top navigation
│   └── theme-toggle.tsx                # Light/Dark mode switcher
├── docs/                               # Centralized Documentation
│   ├── README.md                       # Master index & agent hub (this file)
│   ├── architecture/
│   │   ├── overview.md                 # System architecture & ADR-001
│   │   └── security-and-crypto.md      # Cryptography, RTR, & rate limits
│   ├── database/
│   │   └── schema-and-state.md         # Prisma PostgreSQL & Redis state
│   ├── flows/
│   │   ├── authentication.md           # Zero-password OTP/Magic flow
│   │   └── oauth-oidc.md               # OAuth PKCE, tokens, & RTR
│   ├── api/
│   │   └── reference.md                # Comprehensive endpoint reference
│   └── development/
│       ├── setup-and-workflow.md       # Dev setup, env vars, & testing
│       ├── cicd.md                     # CI/CD & Vercel deployment
│       └── versioning.md               # SemVer 2.0.0 & changelog rules
├── lib/                                # Core Business Logic & Infrastructure
│   ├── crypto/                         # Cryptographic helpers
│   │   ├── hash.ts                     # OTP pepper HMAC, tokens, timingSafe
│   │   ├── jwt.ts                      # RS256 token signing & verification
│   │   ├── keys.ts                     # RSA keypair loading & JWKS export
│   │   └── pkce.ts                     # PKCE challenge & verifier validation
│   ├── db/prisma.ts                    # Cached Prisma client instance
│   ├── redis/redis.ts                  # Cached Redis client instance
│   ├── repositories/                   # Data Access Layer
│   │   ├── auth-state-repository.ts    # Redis auth requests & auth codes
│   │   ├── client-repository.ts        # Prisma client app management
│   │   ├── session-repository.ts       # Prisma sessions & token families
│   │   └── user-repository.ts          # Prisma users & auto-provisioning
│   ├── services/                       # Application Services
│   │   ├── auth-service.ts             # Initiation & verification orchestration
│   │   ├── event-service.ts            # Redis Pub/Sub for SSE sync
│   │   └── oauth-service.ts            # Code exchange & refresh token rotation
│   └── utils/                          # Cross-cutting Utilities
│       ├── anti-enumeration.ts         # Constant latency wrapper
│       └── rate-limiter.ts             # Redis sliding/fixed token bucket
├── prisma/
│   └── schema.prisma                   # Database schema definition
├── scripts/
│   ├── generate-keys.ts                # RSA keypair generation utility
│   ├── seed.ts                         # Client applications seeder
│   ├── test-core.ts                    # Core cryptographic unit test suite
│   └── vercel-ignore-build.sh          # Vercel CLI Option B build skipper
├── AGENTS.md                           # AI Agent mandatory constraints & rules
├── CHANGELOG.md                        # Keep a Changelog record
├── docker-compose.yml                  # PostgreSQL & Redis dev containers
└── package.json                        # Dependencies and build scripts
```

---

## 5. Non-Negotiable Engineering Policies

Every developer and AI agent working on this repository **must** strictly comply with the following rules:

1. **Strict English Only:** All files, code, inline comments, commit messages, documentation, and PR descriptions must be written exclusively in professional English. (Refer to [`AGENTS.md`](../AGENTS.md)).
2. **Zero Emoji Policy in UI:** Never use emojis (e.g. 🔐, ⚠️, 🚀) as icons or functional elements in user interfaces. Always use vector icons from `lucide-react` with standard stroke widths (`2` or `2.5`) and consistent sizing (`w-4 h-4`, `w-5 h-5`).
3. **Strict Cryptographic Standards:**
   - Asymmetric JWT signatures must use **RS256** with minimum 2048-bit RSA keys.
   - OTP hashing must use **HMAC-SHA256** with a server-side pepper secret (`AUTH_PEPPER_SECRET`).
   - Comparison of hashes, secrets, and verifiers must use **constant-time comparison** (`crypto.timingSafeEqual`).
   - Refresh tokens must be hashed with SHA-256 before storage in PostgreSQL.
4. **Backend-for-Frontend (BFF) Pattern:** No tokens in browser storage (`localStorage` or `sessionStorage`).
5. **Quality Gate Verification:** Before committing code, verify:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
6. **Semantic Versioning & Changelog:** Maintain [Semantic Versioning 2.0.0](https://semver.org/) and log all additions, changes, and fixes in [`CHANGELOG.md`](../CHANGELOG.md) under `[Unreleased]`.

---

## 6. Detailed Documentation Index

Explore the specialized guides below for complete architectural specifications:

* **[Architecture Overview](./architecture/overview.md):** System goals, ecosystem boundaries, architectural principles, and Architectural Decision Record ADR-001.
* **[Security & Cryptography](./architecture/security-and-crypto.md):** In-depth specifications for RS256, HMAC-SHA256 OTP hashing, PKCE S256, Refresh Token Rotation, anti-enumeration, and rate limiting.
* **[Database & State Models](./database/schema-and-state.md):** Complete PostgreSQL Prisma schema (`User`, `ClientApp`, `Session`) and Redis ephemeral state data structures.
* **[Authentication Flows](./flows/authentication.md):** Step-by-step lifecycle of Zero-Password authentication, OTP generation, Magic Link scanner evasion, and cross-device SSE synchronization.
* **[OAuth 2.0 & OIDC Flows](./flows/oauth-oidc.md):** Complete guide to PKCE authorization, code exchange, Token Family refresh rotation, and revocation.
* **[API Reference](./api/reference.md):** Exhaustive endpoint specification including HTTP methods, headers, payloads, response schemas, and error codes.
* **[Development & Workflow](./development/setup-and-workflow.md):** Local environment setup, Docker Compose, Prisma migrations, seeding, environment variable catalog, and test execution.
* **[CI/CD & Deployment](./development/cicd.md):** GitHub Actions workflows, Vercel Option B prebuilt deployment strategy, and rollback procedures.
* **[Versioning & Changelog](./development/versioning.md):** SemVer 2.0.0 guidelines, Conventional Commits table, and release tagging protocols.
