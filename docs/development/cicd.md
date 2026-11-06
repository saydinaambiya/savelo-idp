# CI/CD & Vercel PR Deployment Guidelines (Option B: GitHub Actions Prebuilt Deployments)

This document outlines the pipeline architecture, policies, GitHub secrets configuration, and operational procedures for **savelo-idp** continuous integration and deployment on Vercel using **Option B (GitHub Actions Vercel CLI Prebuilt Orchestration)**.

---

## 1. Core Principles & Branching Strategy

1. **Protected Branch (`main`)**:
   - The `main` branch represents the production environment.
   - Direct pushes to `main` are strictly prohibited; all changes must arrive via a Pull Request.
   - Pull Requests can only be merged when all mandatory status checks (Quality Gate) pass and code review approval is obtained.
2. **Branch Naming Conventions**:
   - `feat/<feature-name>`: New capabilities or functional additions.
   - `fix/<bug-name>`: Bug fixes and patches.
   - `chore/<task-name>`: Dependency bumps, tooling, or refactoring.
   - `docs/<doc-name>`: Documentation updates.

---

## 2. Pull Request & Deployment Workflow (Option B)

```
   Developer Branch                 GitHub PR / Actions                      Vercel
        │                                  │                                   │
        │─── git push & open PR ──────────>│                                   │
        │                                  │─── [deploy-preview.yml]           │
        │                                  │    1. Quality Gate (Lint/Type/Test)
        │                                  │    2. vercel pull --preview       │
        │                                  │    3. vercel build                │
        │                                  │    4. vercel deploy --prebuilt ───┼──> Deploy Preview
        │                                  │<── Return Preview URL ────────────┼────────┘
        │                                  │─── Post Comment to PR ────────────│
        │                                  │                                   │
        │─── PR Approved & Merged ────────>│                                   │
                                           │─── [deploy-production.yml]        │
                                           │    1. Quality Gate (Lint/Type/Test/Build)
                                           │    2. vercel pull --production    │
                                           │    3. vercel build --prod         │
                                           │    4. vercel deploy --prebuilt ───┼──> Deploy Production
                                           │                                   │    (Live on Vercel)
```

### Pipeline Workflows:

1. **PR Quality Gate & Preview (`.github/workflows/deploy-preview.yml`)**:
   - Runs code quality gate (ESLint, TypeScript `tsc --noEmit`, core test suite).
   - Generates Prisma client artifacts.
   - Deploys prebuilt artifacts to Vercel Preview.
   - Automatically posts or updates a PR comment containing the preview URL for QA review.
   - Skips deployment step gracefully if secrets are unavailable (e.g. forks).

2. **Standalone Quality Gate (`.github/workflows/ci.yml`)**:
   - Validates code quality on pull requests and pushes without deploying.

3. **Production Deployment (`.github/workflows/deploy-production.yml`)**:
   - Enforces a strict `quality-gate` job that must pass before deployment begins.
   - Validates that Vercel repository secrets are properly set.
   - Pulls production environment variables via `vercel pull`.
   - Generates production build artifacts via `vercel build --prod`.
   - Ships directly to production via `vercel deploy --prebuilt --prod`.

---

## 3. Mandatory Vercel Project Configuration (Option B)

To avoid **duplicate builds** (where Vercel's automatic Git integration builds simultaneously alongside GitHub Actions):

1. Go to **Vercel Dashboard $\rightarrow$ Your Project $\rightarrow$ Settings $\rightarrow$ Git**.
2. Scroll to **Ignored Build Step**.
3. Choose **Custom** and enter:
   ```bash
   bash scripts/vercel-ignore-build.sh
   ```
   *(Or simply `exit 0`)*.
4. Save changes.
   > **Why?** An exit code of `0` tells Vercel's Git hook to skip automatic builds, ensuring only GitHub Actions triggers deployments via `vercel deploy --prebuilt`.

---

## 4. GitHub Repository Secrets Configuration

Configure the following secrets in **GitHub Repository Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

| Secret Name | Description | Source |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Vercel Personal/Team API Token | Generated in [Vercel Account Settings $\rightarrow$ Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel Organization / Scope ID | Found in `.vercel/project.json` or project settings |
| `VERCEL_PROJECT_ID`| Vercel Project ID for `savelo-idp` | Found in `.vercel/project.json` or project settings |

---

## 5. Vercel Dashboard Environment Variables

Configure the following variables in **Vercel Project Settings $\rightarrow$ Environment Variables** for `Preview` and `Production`:

| Variable Name | Required | Description | Example / Recommendation |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string | **Must use connection pooler** in serverless (e.g., Neon pooled URI, Supabase port `6543`, or AWS RDS Proxy). |
| `REDIS_URL` | Yes | Managed Redis URI | Upstash Redis connection string (`redis://...`). |
| `AUTH_PEPPER_SECRET` | Yes | Server secret pepper for OTP HMAC-SHA256 | High-entropy random string (min 32 characters). |
| `IDP_ISSUER_URL` | Yes | Public URL of this IdP | e.g. `https://idp.savelo.web.id` or `https://savelo-idp.vercel.app` |
| `JWT_PRIVATE_KEY` | Yes | 2048-bit RS256 Private Key (PEM or base64) | Required in production (prevents mismatched serverless keys). |
| `JWT_PUBLIC_KEY` | Yes | 2048-bit RS256 Public Key (PEM or base64) | Matching public key exported for JWKS. |
| `JWT_KEY_ID` | Optional | Key ID for JWKS header `kid` | Default: `savelo-idp-key-1` |
| `COOKIE_NAME` | Optional | Session cookie identifier | Default: `savelo_session` |
| `COOKIE_DOMAIN` | Optional | Shared cookie root domain | e.g. `.savelo.web.id` (leave empty for default) |

---

## 6. Contributor Checklist Before Merge

Every contributor must verify:
1. [x] **Lint & Typecheck:** Clean runs with zero errors and zero warnings (`npm run lint && npm run typecheck`).
2. [x] **Core Tests:** Passes cryptographic verification suite (`npm test`).
3. [x] **Zero Emoji Policy:** User interfaces strictly use vector icons from `lucide-react` (per `AGENTS.md`).
4. [x] **Changelog Entry:** Documented under `## [Unreleased]` in [`CHANGELOG.md`](../../CHANGELOG.md).
5. [x] **SemVer Classification:** Marked as Patch, Minor, or Major in PR description per [`docs/development/versioning.md`](versioning.md).

---

## 7. Rollback & Emergency Procedures

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
