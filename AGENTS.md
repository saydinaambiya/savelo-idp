<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Centralized Documentation Mandate (Read Before Scanning Repo)
- **AGENT WORKFLOW ACCELERATION:** When starting any task, DO NOT scan through the entire repository or exhaust tokens inspecting random files.
- **CENTRAL ENTRYPOINT:** Always read [docs/README.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/README.md) first. It provides an authoritative blueprint:
  - System architecture & ADR-001: [docs/architecture/overview.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/architecture/overview.md)
  - Security, RS256, & RTR cryptography: [docs/architecture/security-and-crypto.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/architecture/security-and-crypto.md)
  - PostgreSQL schema & Redis state machine: [docs/database/schema-and-state.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/database/schema-and-state.md)
  - Zero-Password & OAuth PKCE lifecycles: [docs/flows/authentication.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/flows/authentication.md) & [docs/flows/oauth-oidc.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/flows/oauth-oidc.md)
  - Complete API endpoint contracts: [docs/api/reference.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/api/reference.md)
  - Local setup, Docker, env vars & tests: [docs/development/setup-and-workflow.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/development/setup-and-workflow.md)
- Consulting `docs/README.md` first drastically speeds up task completion and eliminates redundant code exploration.

## UI Iconography Standards (Zero Emoji Policy)
- **NO EMOJIS AS ICONS:** Never use emojis (e.g. 🔐, ⚠️, 🚀, ➔, ↗) as icons or visual markers in user interfaces.
- **PROFESSIONAL VECTOR ICONS:** Always use vector icons from `lucide-react` with clean, simple, bold, and elegant aesthetics (e.g. `Lock`, `ShieldCheck`, `ArrowRight`, `ExternalLink`, `KeyRound`, `Smartphone`, `Mail`).
- **STYLING:** Maintain consistent sizes (`w-4 h-4`, `w-5 h-5`, `w-6 h-6`), appropriate stroke-widths (`strokeWidth={2}` or `2.5`), and harmonious enterprise palette tokens.

## Versioning & Changelog Standards
- **Semantic Versioning (SemVer 2.0.0):** Adhere to `MAJOR.MINOR.PATCH`. See [docs/VERSIONING.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/VERSIONING.md).
  - `MAJOR`: Incompatible API or database breaking changes.
  - `MINOR`: Backwards-compatible new features, new endpoints, or UI additions.
  - `PATCH`: Backwards-compatible bug fixes or minor patches.
- **Keep a Changelog:** Any non-trivial feature, fix, or deprecation MUST be documented in [CHANGELOG.md](file:///Users/saydina/Documents/repositories/savelo-idp/CHANGELOG.md) under the `[Unreleased]` section with the appropriate category:
  - `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- **Commit Format:** Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `chore:`).

## CI/CD & Pull Request Rules
- **Pre-PR Verification:** Before completing tasks or submitting PRs, always ensure all verification passes:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- **Vercel Deployment Pipeline:** Refer to [docs/CICD.md](file:///Users/saydina/Documents/repositories/savelo-idp/docs/CICD.md). Every PR generates an isolated Vercel Preview deployment, and merging to `main` triggers automated production deployment.

## Repository Language Policy (Strict English Only)
- **ALL ENGLISH CODE & REPOSITORY:** All code, inline comments, docstrings, variable/type naming, files, documentation, commit messages, PR descriptions, and configuration across the entire codebase MUST be written exclusively in proper, professional English.
- **NO BILINGUAL / NON-ENGLISH CODE OR COMMENTS:** Never write non-English text or mixed bilingual comments in any source file. (While agent conversation responses with the user may use the user's preferred language, any code written or modified in repository files must strictly be 100% proper English).



