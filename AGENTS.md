<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
- **ALL ENGLISH REPOSITORY:** All files, documentation, code, inline comments, docstrings, commit messages, PR descriptions, issue templates, and workflow files across the entire codebase MUST be written exclusively in proper, professional English.
- **NO BILINGUAL / NON-ENGLISH TEXT:** Never use Indonesian or mixed/bilingual text in any repository file. (Agent chat responses to the user may be in the user's preferred language, but any content committed or saved into the repository files must strictly be 100% proper English).



