# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial OAuth 2.0 / OIDC Identity Provider (IdP) core architecture & scaffolding.
- Prisma schema for Users, Clients, Authorizations, and Refresh Tokens.
- Redis-backed session & authorization code storage.
- Verification and login UI views with Lucide vector iconography.
- Architecture design documentation (`docs/savelo_idp_architecture_design.md`).
- Semantic Versioning & Changelog maintenance guidelines (`docs/VERSIONING.md`).
- GitHub Actions CI/CD workflows for PR quality checks, automated Vercel Preview deployments with PR commenting, and automated Vercel Production deployment on merge to `main`.
- Pull Request template and CI/CD policy documentation (`docs/CICD.md`).

### Fixed
- Fixed TypeScript type error in `app/layout.tsx` by replacing undeclared `LayoutProps` with standard `Readonly<{ children: React.ReactNode }>`.

---

## [0.1.0] - 2026-11-04

### Added
- Initial project setup bootstrapped with Next.js 16 and React 19.
- Tailwind CSS v4 styling configuration.
- ESLint and TypeScript configurations.
- Docker Compose setup for PostgreSQL and Redis services.
