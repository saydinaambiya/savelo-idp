# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Standardized SCIM v2.0 (RFC 7643 & RFC 7644) server implementation for cross-domain user provisioning and tenant isolation.
- SCIM endpoints: `GET /api/scim/v2/ServiceProviderConfig`, `GET/POST /api/scim/v2/Users`, and `GET/PATCH/DELETE /api/scim/v2/Users/[id]`.
- SCIM Bearer token authentication middleware with SHA-256 hashed secret comparison (`lib/auth/scim-auth.ts`).
- Multi-tenant client user mapping model `ClientUser` in Prisma schema with user active/deactivation lifecycle controls.
- Comprehensive test suite for SCIM protocol serialization, error schemas, and PatchOp operations (`scripts/test-scim.ts`).
- Centralized documentation hub (`docs/README.md`) designed for AI coding agents and human engineers to quickly navigate system architecture, protocols, and contracts without scanning the entire repository.
- Modular architecture documentation (`docs/architecture/overview.md` and `docs/architecture/security-and-crypto.md`) covering system topology, ADR-001, RS256 token signing, HMAC-SHA256 OTP pepper hashing, and Refresh Token Rotation (RTR).
- Database and ephemeral state model documentation (`docs/database/schema-and-state.md`) detailing PostgreSQL Prisma models and Redis state machine.
- Comprehensive authentication and OAuth 2.0 PKCE lifecycle specifications (`docs/flows/authentication.md` and `docs/flows/oauth-oidc.md`).
- Complete API route reference (`docs/api/reference.md`) covering all endpoints, parameters, and response schemas.
- Developer setup, workflow, and operations guide (`docs/development/setup-and-workflow.md`, `docs/development/cicd.md`, `docs/development/versioning.md`).
- Centralized documentation mandate and quickstart in `AGENTS.md`.
- Initial OAuth 2.0 / OIDC Identity Provider (IdP) core architecture & scaffolding.
- Prisma schema for Users, Clients, Authorizations, and Refresh Tokens.
- Redis-backed session & authorization code storage.
- Verification and login UI views with Lucide vector iconography.
- Architecture design documentation (`docs/savelo_idp_architecture_design.md`).
- Semantic Versioning & Changelog maintenance guidelines (`docs/VERSIONING.md`).
- Pull Request template and CI/CD policy documentation (`docs/CICD.md`).
- Monochromatic Black & White (B&W) design system inspired by enterprise cyber-defense aesthetics with zero neon colors and zero emojis.
- Dynamic Dark/Light mode theme switcher powered by `useSyncExternalStore` and `localStorage`.
- Developer Console UI (`/console`) and API (`/api/developer/apps`) for self-service OAuth client app registration with one-time secret display and `.env` generator.
- Interactive Developer Documentation Portal (`/docs`) covering zero-password architecture, PKCE flow, and tabbed code snippets (TypeScript, cURL, Python).
- Re-themed login and verification screens (`/oauth/authorize`, `/verify`) with recessed monospace inputs and high-contrast styling.
- Vercel CLI Prebuilt Deployment pipelines (`deploy-production.yml` and `deploy-preview.yml`) configured for Option B.
- `scripts/vercel-ignore-build.sh` script to suppress duplicate automated Vercel git builds.
- Root `vercel.json` configuration for framework settings.

### Changed
- Refined Navbar: removed verbose versioning badge and replaced generic buttons with clean, restrained enterprise actions.
- Cleaned Hero section: removed artificial appliance box and marketing tips in favor of spacious, authoritative typography.
- Standardized Lifecycle section cards with vector icons, removing sequential numbers.
- Streamlined Footer to eliminate marketing buzzwords.
- Applied JetBrains Mono font for documentation descriptions, code specs, and navigation indexes.
- Upgraded Developer Console into an interactive PKCE Auth Sandbox and Token Exchange Playground, removing public client credential listings.
- Standardized all button elements across the application with global pointer cursors and uniform primary typography.
- Enhanced Navbar with bold brand typography and symmetrical, identically-sized Console and Sign In buttons.
- Removed sequential numbering from Documentation sections and navigation index, keeping pure title labels with vector iconography.

### Fixed
- Fixed TypeScript type error in `app/layout.tsx` by replacing undeclared `LayoutProps` with standard `Readonly<{ children: React.ReactNode }>`.
- Fixed missing Quality Gate dependency in `deploy-production.yml` to prevent broken builds from deploying to production.
- Harmonized secret pepper environment variable from `OTP_PEPPER_SECRET` to `AUTH_PEPPER_SECRET` across CI and crypto utilities with backward compatibility.
- Prevented silent fallback to ephemeral in-memory JWT keypairs in production serverless environments.
- Cached Prisma and Redis client instances across warm serverless Lambda invocations to mitigate connection pool exhaustion.

---

## [0.1.0] - 2026-11-04

### Added
- Initial project setup bootstrapped with Next.js 16 and React 19.
- Tailwind CSS v4 styling configuration.
- ESLint and TypeScript configurations.
- Docker Compose setup for PostgreSQL and Redis services.
