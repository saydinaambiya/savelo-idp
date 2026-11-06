# Savelo Identity Provider (IdP)

Savelo IdP is a centralized, enterprise-grade Identity Provider and OpenID Connect (OIDC) / OAuth 2.0 authorization server engineered for the Savelo multi-application ecosystem (Savelo Tools, Savetable, Saveroute, and third-party integrations).

---

## Centralized Documentation Hub

> **For Engineers & AI Coding Agents:**  
> Detailed architecture, cryptographic specifications, database schemas, and API contracts are centralized in the [`/docs`](docs/README.md) directory. Read the documentation hub before modifying or scanning the codebase:
>
> **[Read the Documentation Hub (`docs/README.md`)](docs/README.md)**

### Key Documentation Sections:
- **[Architecture Overview](docs/architecture/overview.md):** System topology, core directives, and approved ADR-001.
- **[Security & Cryptography](docs/architecture/security-and-crypto.md):** RS256 token signing, HMAC-SHA256 OTP hashing, PKCE S256, Refresh Token Rotation (RTR), and constant-latency anti-enumeration.
- **[Database Schema & Ephemeral State](docs/database/schema-and-state.md):** PostgreSQL Prisma models (`User`, `ClientApp`, `Session`) and Redis state machine.
- **[Zero-Password Auth Flow](docs/flows/authentication.md):** OTP generation, Magic Link scanner evasion, and real-time cross-device SSE synchronization.
- **[OAuth 2.0 & OIDC Flow](docs/flows/oauth-oidc.md):** PKCE authorization, authorization code exchange, token rotation, and token revocation.
- **[API Reference](docs/api/reference.md):** Complete specifications for all API routes and response schemas.
- **[Development Setup](docs/development/setup-and-workflow.md):** Docker Compose setup, database migrations, seeding, and environment variables.
- **[CI/CD & Deployment](docs/development/cicd.md):** GitHub Actions quality gates and Vercel Option B prebuilt deployment.
- **[Versioning & Changelog](docs/development/versioning.md):** SemVer 2.0.0 guidelines and Conventional Commits.

---

## Core Features

- **Zero Passwords:** Numeric 6-digit OTPs (salted with server pepper) and high-entropy 32-byte Magic Links.
- **RFC 7636 PKCE:** Mandatory Proof Key for Code Exchange with SHA-256 challenges on all authorization requests.
- **Refresh Token Rotation (RTR):** Token Family tracking with immediate automatic revocation on replay detection.
- **Cross-Device SSE Sync:** Verify on a mobile device and instantly complete login on desktop via Redis Pub/Sub and Server-Sent Events.
- **Asymmetric RS256 Tokens:** Standard OIDC discovery (`/.well-known/openid-configuration`) and JWKS (`/.well-known/jwks.json`).
- **Developer Console:** Interactive client application registration and PKCE testing sandbox at `/console`.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 2. Quickstart
```bash
# Install dependencies
npm ci

# Start local PostgreSQL and Redis containers
npm run db:up

# Provision database schema & seed initial client apps
npm run db:setup

# Run core verification tests
npm test

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the homepage or [http://localhost:3000/console](http://localhost:3000/console) for the Developer Console.

---

## Quality Gate Checklist

Before submitting pull requests, ensure all checks pass:
```bash
npm run lint        # ESLint 9 checks
npm run typecheck   # TypeScript tsc --noEmit
npm test            # Cryptographic core test suite
npm run build       # Next.js build verification
```

---

## Versioning & Governance

- **Changelog:** All changes are maintained in [CHANGELOG.md](CHANGELOG.md) adhering to [Keep a Changelog](https://keepachangelog.com/).
- **Semantic Versioning:** Strictly follows [SemVer 2.0.0](https://semver.org/) per [docs/development/versioning.md](docs/development/versioning.md).
- **CI/CD Pipeline:** Detailed in [docs/development/cicd.md](docs/development/cicd.md).
- **Strict English Repository:** All code, comments, documentation, and commit messages must be in English (see [AGENTS.md](AGENTS.md)).
- **Zero-Emoji UI:** Vector iconography only (`lucide-react`).
