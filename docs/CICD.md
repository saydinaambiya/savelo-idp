# CI/CD & Vercel PR Deployment Guidelines

This document outlines the pipeline architecture, policies, GitHub secrets configuration, and operational procedures for **savelo-idp** continuous integration and deployment on Vercel.

---

## 1. Core Principles & Branching Strategy

1. **Protected Branch (`main`)**:
   - The `main` branch represents the production environment.
   - Direct pushes to `main` are strictly prohibited; all changes must arrive via a Pull Request.
   - Pull Requests can only be merged when all mandatory status checks (Quality Gate) pass and at least one code review approval is obtained.
2. **Branch Naming Conventions**:
   - `feat/<feature-name>`: New capabilities or functional additions.
   - `fix/<bug-name>`: Bug fixes and patches.
   - `chore/<task-name>`: Dependency bumps, tooling, or refactoring.
   - `docs/<doc-name>`: Documentation updates.

---

## 2. Pull Request & Preview Deployment Workflow

```
   Developer Branch                 GitHub PR                     Vercel
        │                              │                            │
        │─── git push & open PR ──────>│                            │
        │                              │─── Trigger CI Quality Gate │
        │                              │    (Lint, Typecheck, Test) │
        │                              │                            │
        │                              │─── Trigger Preview Deploy ─┼──> Build & Deploy
        │                              │                            │    Preview Instance
        │                              │<── Return Preview URL ─────┼─────────┘
        │                              │
        │                              │─── Bot Comments on PR ────>│
        │                              │    (with Live Preview Link)│
        │                              │                            │
        │                              │─── Review & QA Test ───────│
        │                              │                            │
        │─── PR Approved & Merged ────>│                            │
                                       │─── Trigger Prod Deploy ────┼──> Deploy to Production
                                                                    │    (savelo-idp.vercel.app)
```

### Pipeline Steps:

1. **Quality Gate (`.github/workflows/ci.yml`)**:
   - Code style and Next.js / React 19 linting: `npm run lint`.
   - Strict TypeScript validation: `npm run typecheck` (`tsc --noEmit`).
   - Cryptographic and auth security test suite: `npm test` (`scripts/test-core.ts`).
   - Production build verification: `npm run build`.

2. **Preview Deployment (`.github/workflows/deploy-preview.yml`)**:
   - Pulls preview environment settings via Vercel CLI (`vercel pull`).
   - Builds isolated deployment artifacts (`vercel build`).
   - Deploys a unique preview instance to Vercel (`vercel deploy --prebuilt`).
   - Automatically posts or updates a PR comment containing the preview URL for immediate review.

3. **Concurrency Control**:
   - Pushing new commits to an existing PR automatically cancels in-flight builds (*cancel-in-progress*) and creates a fresh preview deployment for the latest commit.

---

## 3. GitHub Secrets Configuration

To enable GitHub Actions deployment to Vercel, configure the following secrets in **GitHub Repository Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

| Secret Name | Description | Source |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Vercel Personal/Team API Token | Generated in [Vercel Account Settings $\rightarrow$ Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel Organization / Scope ID | Located in `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID`| Vercel Project ID for `savelo-idp` | Located in Project Settings on Vercel or `.vercel/project.json` |

### Vercel Dashboard Environment Variables:
Ensure the following variables are configured in **Vercel Project Settings $\rightarrow$ Environment Variables** for `Preview` and `Production` targets:

- `DATABASE_URL`: PostgreSQL connection string (pooler recommended, e.g., Supabase, Neon, AWS RDS).
- `REDIS_URL`: Managed Redis instance connection URI (e.g., Upstash Redis).
- `JWT_PRIVATE_KEY` & `JWT_PUBLIC_KEY`: 2048-bit RS256 PEM-formatted key pair.
- `OTP_PEPPER_SECRET`: High-entropy 32+ character secret for OTP HMAC-SHA256 hashing.
- `NEXT_PUBLIC_APP_URL`: Canonical base URL of the deployment.

---

## 4. Contributor Checklist Before Merge

Every contributor must verify:
1. [x] **Lint & Typecheck:** Clean runs with zero errors and zero warnings.
2. [x] **Zero Emoji Policy:** User interfaces strictly use vector icons from `lucide-react` (per `AGENTS.md`).
3. [x] **Changelog Entry:** Documented under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md).
4. [x] **SemVer Classification:** Marked as Patch, Minor, or Major in PR description per [`docs/VERSIONING.md`](VERSIONING.md).
5. [x] **Preview Validation:** Tested the live preview URL posted by the bot across relevant routes (`/oauth/authorize`, `/verify`, etc.).

---

## 5. Rollback & Emergency Procedures

If an incident occurs after production deployment:
1. **Instant Rollback via Vercel Dashboard**:
   - Go to Vercel Dashboard $\rightarrow$ Deployments $\rightarrow$ Select previous stable deployment $\rightarrow$ Click `...` $\rightarrow$ **Instant Rollback**.
2. **Git Revert**:
   - Create a revert commit on `main`:
     ```bash
     git checkout main
     git pull origin main
     git revert -m 1 <merge-commit-hash>
     git checkout -b fix/rollback-<incident-id>
     git push origin fix/rollback-<incident-id>
     ```
   - Open and merge the rollback PR following standard CI validation.
