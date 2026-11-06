# Semantic Versioning & Changelog Guidelines

> **Notice:** This document is mirrored in [docs/development/versioning.md](development/versioning.md). For the centralized documentation index, see [docs/README.md](README.md).

This document outlines the versioning rules, commit conventions, and changelog maintenance standards for the **savelo-idp** project.

---

## 1. Semantic Versioning Specification (SemVer 2.0.0)

Version numbers strictly adhere to the following format:

$$\text{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}[-\mathbf{PRERELEASE}][+\mathbf{BUILD}]$$

Examples: `v0.1.0`, `v1.0.0`, `v1.2.3`, `v2.0.0-beta.1`.

### A. Version Components

1. **MAJOR (X.0.0)**
   - Incremented when making **incompatible API changes (breaking changes)**, such as:
     - Changes to OAuth 2.0 / OIDC request or response contracts that break existing client applications.
     - Database schema changes that require manual downtime migrations or break model backward compatibility.
     - Modification or removal of required environment variables.
     - Deprecation and subsequent removal of previously stable endpoints or behaviors.

2. **MINOR (0.X.0)**
   - Incremented when adding **functionality in a backward-compatible manner**, such as:
     - Adding new API endpoints or grant types (e.g., Device Authorization Grant, Token Revocation endpoint).
     - Adding optional request or response fields.
     - Introducing new UI views (e.g., user consent screens, profile management).
     - Non-breaking performance optimizations and architectural enhancements.

3. **PATCH (0.0.X)**
   - Incremented when making **backward-compatible bug fixes**, such as:
     - Security patches and vulnerability fixes.
     - Fixing authentication or session edge-case bugs without altering the API contract.
     - UI/UX styling, accessibility improvements, and typo corrections.
     - Routine non-breaking dependency updates.

### B. Pre-v1.0.0 Development Phase (0.y.z)
- While the major version is `0.y.z`:
  - Rapid architectural iterations may occur.
  - Breaking changes increment the **MINOR** version (`0.1.x` $\rightarrow$ `0.2.0`).
  - Once core identity provider features (OIDC Discovery, JWKS, Authorization Endpoint, Token Exchange, and Refresh Token Rotation) are thoroughly tested and production-ready, the version will be bumped to **`1.0.0`**.

---

## 2. Commit Standards (Conventional Commits) & SemVer Mapping

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s): BREAKING CHANGE, Closes #issue]
```

### Commit Type to SemVer Mapping:

| Commit Type | SemVer Impact | Description |
| :--- | :--- | :--- |
| `feat:` | **MINOR** | A new backward-compatible feature |
| `fix:` | **PATCH** | A bug fix |
| `perf:` | **PATCH** | A performance improvement |
| `refactor:` | **PATCH** (if user-impacting) / Internal | Code change that neither fixes a bug nor adds a feature |
| `docs:` | None (or PATCH if published) | Documentation-only changes |
| `test:`, `build:`, `ci:`, `chore:` | None | Tooling, dependencies, tests, or CI configuration |
| `*!:` or `BREAKING CHANGE:` | **MAJOR** | Any change introducing backward incompatibility |

---

## 3. Changelog Maintenance Rules (Keep a Changelog)

The [CHANGELOG.md](../CHANGELOG.md) file adheres to [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/):

1. **Human-Centric Content:**
   - Write clear, concise summaries for developers, operators, and API consumers, rather than dumping raw commit logs.
2. **Standard Change Categories:**
   Group entries under each release into the following standard categories:
   - `Added`: For new features and capabilities.
   - `Changed`: For changes in existing functionality.
   - `Deprecated`: For soon-to-be removed features.
   - `Removed`: For now-removed features.
   - `Fixed`: For bug fixes.
   - `Security`: In case of vulnerabilities or security hardening.
3. **The `[Unreleased]` Section:**
   - Every pull request that introduces user-visible changes or developer-facing modifications must add an entry under the `## [Unreleased]` section.
   - This ensures a continuous record of changes before releases are tagged.

---

## 4. Release Workflow

When publishing a new release:

1. **Determine the Next Version:**
   - Review entries under `## [Unreleased]` to assess whether the release is `MAJOR`, `MINOR`, or `PATCH`.
2. **Update `CHANGELOG.md`:**
   - Convert `## [Unreleased]` into the new version header with the release date (`YYYY-MM-DD`):
     ```markdown
     ## [Unreleased]

     ## [0.2.0] - 2026-11-10
     ### Added
     ...
     ```
3. **Update `package.json`:**
   - Update the `"version"` field in `package.json` (or use `npm version <major|minor|patch> --no-git-tag-version`).
4. **Tag and Push:**
   ```bash
   git add CHANGELOG.md package.json package-lock.json
   git commit -m "chore(release): v0.2.0"
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin main --tags
   ```
