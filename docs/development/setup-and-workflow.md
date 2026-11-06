# Development Setup & Engineering Workflow

This document details local development environment configuration, Docker services, database seeding, environment variable specifications, and automated verification procedures for **Savelo IdP**.

---

## 1. Prerequisites

Before running the project locally, ensure you have installed:
- **Node.js:** v20.x or higher (LTS recommended).
- **Package Manager:** `npm` v10+ (or `pnpm` / `bun`).
- **Docker & Docker Compose:** Required to run local PostgreSQL and Redis containers.

---

## 2. Quickstart Guide (Local Setup)

Follow these steps to set up a complete local development environment:

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/saydina/savelo-idp.git
cd savelo-idp
npm ci

# 2. Start PostgreSQL and Redis containers
npm run db:up

# 3. Provision database schema & seed initial client apps
npm run db:setup

# 4. Generate local RS256 keypair (optional in dev, mandatory in prod)
npm run generate:keys

# 5. Run core verification test suite
npm test

# 6. Start Next.js development server
npm run dev
```

The application will be available at **`http://localhost:3000`**.

---

## 3. Environment Variables Specification

Create a `.env.local` file in the project root. The following table details all configuration variables:

| Variable Name | Required | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/savelo_idp?schema=public` | PostgreSQL connection URI. Use connection pooling (e.g. Neon pooled or AWS RDS Proxy) in production. |
| `REDIS_URL` | **Yes** | `redis://localhost:6379` | Redis connection URI for ephemeral state and rate limiting. |
| `AUTH_PEPPER_SECRET` | **Yes** | `development-pepper-secret-min-32-chars-long` | High-entropy server secret used for HMAC-SHA256 OTP hashing. |
| `IDP_ISSUER_URL` | No | `http://localhost:3000` | Canonical issuer URL written to token `iss` claim and OIDC discovery. Set to `https://auth.savelo.web.id` in production. |
| `JWT_PRIVATE_KEY` | Prod Only | In-memory keypair generated automatically in dev | 2048-bit RSA Private Key in PEM or Base64 format. **Required in production serverless.** |
| `JWT_PUBLIC_KEY` | Prod Only | In-memory keypair generated automatically in dev | 2048-bit RSA Public Key in PEM or Base64 format. |
| `JWT_KEY_ID` | No | `savelo-idp-key-1` | Identifier (`kid`) included in JWT header and JWKS schema. |
| `COOKIE_NAME` | No | `savelo_session` | Name of the session cookie. |
| `COOKIE_DOMAIN` | No | `undefined` (host-only) | Cookie domain (e.g. `.savelo.web.id` for shared multi-subdomain access). |

---

## 4. Key Management & Generation Script

In development, `lib/crypto/keys.ts` generates an ephemeral RSA 2048 keypair in memory. However, for staging and production environments, permanent keys must be supplied.

Generate keys using the included utility:
```bash
npm run generate:keys
```
This produces:
- `private.pem`: RSA private key (keep secret!).
- `public.pem`: RSA public key.
- Base64-encoded strings ready to paste into GitHub Secrets or Vercel Environment Variables.

---

## 5. NPM Scripts Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts local Next.js development server with Turbopack. |
| `npm run build` | `next build` | Compiles production build and validates static routes. |
| `npm run start` | `next start` | Runs the compiled production server locally. |
| `npm run lint` | `eslint` | Executes ESLint 9 checks across the codebase. |
| `npm run typecheck` | `tsc --noEmit` | Validates TypeScript types without emitting JavaScript. |
| `npm test` | `tsx scripts/test-core.ts` | Runs cryptographic assertions (OTP HMAC, PKCE S256, JWT RS256, timing-safe equality). |
| `npm run db:up` | `docker compose up -d` | Launches local PostgreSQL (port 5432) and Redis (port 6379). |
| `npm run db:down` | `docker compose down` | Stops and removes local Docker service containers. |
| `npm run db:logs` | `docker compose logs -f` | Tails output logs from Postgres and Redis containers. |
| `npm run db:setup` | `docker compose up -d && npx prisma db push && npm run db:seed` | One-command complete database provisioning and seeding. |
| `npm run db:seed` | `tsx scripts/seed.ts` | Seeds standard client apps (`savelo-tools`, `savetable`, `saveroute`). |
| `npm run generate:keys` | `tsx scripts/generate-keys.ts` | Generates 2048-bit RSA keypairs for JWT signing. |

---

## 6. Pre-Commit Quality Gate Checklist

Before opening a pull request or submitting code changes, verify that all four quality gates pass cleanly:

```bash
# 1. Linting
npm run lint

# 2. Type Checking
npm run typecheck

# 3. Cryptographic Core Tests
npm test

# 4. Production Build Verification
npm run build
```
*(Any warnings or errors will fail CI pipelines on GitHub Actions).*
