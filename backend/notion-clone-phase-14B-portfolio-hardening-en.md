# Notion Clone — Phase 14B: Portfolio Hardening, Repository Quality & Deployment Readiness

You are a **Senior Full-Stack Engineer, DevOps Engineer, QA Engineer, Security Reviewer, Technical Writer, and Portfolio Reviewer**.

Phase 14A has already addressed the critical and high-priority runtime/security issues in the Notion Clone.

Your task is to implement **Phase 14B — Portfolio Hardening**.

The goal is NOT to add major product features. The goal is to make the project:

```text
Clean
Reproducible
Testable
Documented
Deployable
Presentable
Portfolio-ready
```

---

# IMPORTANT RULES

## Rule 1 — Phase 14A Must Remain Stable

Do not undo or weaken:
- authorization
- API contract fixes
- editor/history behavior
- public sharing security
- file validation
- subtree restore
- AI authorization/security

If a Phase 14B change risks breaking Phase 14A, make the smallest safe adjustment.

## Rule 2 — No Feature Creep

Do NOT add:
- microservices
- Kubernetes
- CQRS
- GraphQL
- event sourcing
- unrelated product features
- major UI redesigns

## Rule 3 — Work Sequentially

Implement in this order:

```text
Phase 14B.0 — Baseline & Git Hygiene Audit
Phase 14B.1 — Repository Cleanup
Phase 14B.2 — Package Manager & Frontend Validation
Phase 14B.3 — Test Portability & CI Readiness
Phase 14B.4 — Notification Event Producers
Phase 14B.5 — Refresh Token Hardening
Phase 14B.6 — Database Migration & Deployment Strategy
Phase 14B.7 — README & Developer Documentation
Phase 14B.8 — Portfolio Presentation Readiness
Phase 14B.9 — Final Full-Stack Verification
```

Validate each phase before moving on.

---

# PHASE 14B.0 — BASELINE & GIT HYGIENE AUDIT

Before modifying code:

1. Inspect Git-tracked files.
2. Inspect `.gitignore` files.
3. Inspect package-manager lockfiles.
4. Inspect generated build artifacts.
5. Inspect README/documentation.
6. Inspect frontend/backend test configuration.
7. Inspect Docker/deployment setup.
8. Inspect notification creation paths.
9. Inspect refresh-token persistence.
10. Inspect EF migrations and deployment flow.

Create:

| Area | Current State | Problem | Planned Action |
|---|---|---|---|
| `.gitignore` | | | |
| `bin/obj` | | | |
| lockfiles | | | |
| scaffold files | | | |
| mocks | | | |
| frontend tests | | | |
| backend integration tests | | | |
| notifications | | | |
| refresh tokens | | | |
| migrations | | | |
| README | | | |
| deployment docs | | | |

Do not modify code during this baseline step.

---

# PHASE 14B.1 — REPOSITORY CLEANUP

## Confirmed repository problems

Previous audit identified:

- generated `bin/` and `obj/` files tracked in Git
- missing useful root `.gitignore`
- both npm and pnpm lockfiles committed
- placeholder/scaffold files
- obsolete mock files
- hardcoded localhost fallbacks
- generic scaffold README

## Root `.gitignore`

Create or improve the root `.gitignore`.

At minimum consider:

```text
# .NET
bin/
obj/

# Node
node_modules/
.next/
coverage/

# Environment
.env
.env.local
.env.*.local

# IDE/editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

Keep example configuration files such as `.env.example` tracked.

## Remove tracked generated artifacts

Remove `bin/` and `obj/` from Git tracking while preserving normal local builds.

Do not delete legitimate source files.

## Placeholder files

Review and remove only files that are truly unused, such as placeholder `Class1.cs` or `UnitTest1.cs` files.

## Old mocks

Classify each mock as:

```text
Production dependency
Test fixture
Demo fixture
Obsolete
```

Remove only obsolete mocks. Keep useful test doubles.

## Hardcoded URLs

Search for:

```text
localhost
127.0.0.1
http://
https://
```

Move environment-specific runtime URLs into configuration where appropriate.

Do not remove legitimate documentation examples.

---

# PHASE 14B.2 — PACKAGE MANAGER & FRONTEND VALIDATION

## Goal

Use exactly one package manager for the Frontend.

Inspect:

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

Choose the package manager already intended by the project. Prefer pnpm only if the existing project is genuinely pnpm-based.

Remove conflicting lockfiles only after confirming the selected manager.

## Fresh install verification

Run the clean/reproducible install command, for example:

```bash
pnpm install --frozen-lockfile
```

Then run:

```bash
pnpm lint
pnpm test
pnpm build
```

Also run TypeScript validation if not already part of build:

```bash
pnpm exec tsc --noEmit
```

or the equivalent project command.

Do not claim success unless the commands actually execute.

Fix only real build/lint/type/test blockers. Do not perform unrelated refactors.

Classify each issue as:

```text
Build blocker
Lint blocker
Type error
Test failure
Warning
```

---

# PHASE 14B.3 — TEST PORTABILITY & CI READINESS

## Confirmed problem

Backend integration tests previously failed during test-host startup because Windows Event Log logging required unavailable permissions.

Tests must be environment-independent.

## Goal

Make tests runnable in:

```text
Local machine
CI
Linux runner
Windows runner where practical
Containerized CI environment
```

## Test host configuration

For integration tests:

- disable/replace Windows Event Log provider
- use console/test logging
- avoid OS-specific dependencies
- avoid production secrets
- avoid destructive database assumptions

## Database strategy

Inspect the current integration-test database approach.

Use the smallest reliable strategy, such as:

```text
Dedicated PostgreSQL test DB
PostgreSQL service container
Existing isolated test fixture
```

Do not silently switch to an in-memory provider if PostgreSQL-specific behavior matters.

## Backend validation

Run:

```bash
dotnet restore
dotnet build
dotnet test
```

Report exact unit/integration results.

## Frontend tests

Review Vitest coverage and add only high-value missing tests where useful.

## CI workflow

If CI is missing, add a practical GitHub Actions workflow.

Recommended checks:

```text
Frontend:
- install
- lint
- test
- build

Backend:
- restore
- build
- test
```

If integration tests require PostgreSQL, configure a service container or equivalent.

Never embed secrets in CI YAML.

---

# PHASE 14B.4 — NOTIFICATION EVENT PRODUCERS

## Confirmed problem

Notification APIs/UI exist, but production actions do not consistently create notifications.

## Goal

Make notifications a real feature instead of an API/UI shell.

Inspect existing notification types and create notifications only from real supported events such as:

```text
Workspace invitation
Page sharing
Comment
Reply
Mention if mentions truly exist
Permission change if supported
```

Do not invent unsupported notification types.

## Transactional consistency

Where practical:

```text
Business action
+
Notification creation
```

should succeed consistently.

Avoid orphaned notifications.

## Prevent self-noise

Do not generate meaningless notifications to the actor unless intentionally designed.

## Authorization

Notifications must be scoped to the target user only.

## Tests

Add coverage for:

```text
Workspace invitation creates notification
Page share creates notification
Comment/reply creates notification
Notification isolation
Unread count
Mark read
Mark all read
```

If mentions are not implemented, document that instead of pretending they are.

---

# PHASE 14B.5 — REFRESH TOKEN HARDENING

## Confirmed weakness

Refresh tokens are stored plaintext in the database.

## Goal

Store only a cryptographic hash of refresh tokens if compatible with the current architecture.

Target concept:

```text
Raw refresh token
      ↓
return to client
      ↓
hash
      ↓
store hash in DB
```

On refresh:

```text
Client token
 ↓
hash
 ↓
compare stored hash
```

Never log raw tokens.

## Rotation

Preserve refresh-token rotation.

At minimum:

```text
used token revoked
new token issued
old token reuse rejected
```

Consider token-family/reuse detection if it fits the existing model without large redesign.

## Session revocation

Ensure logout/revoke invalidates the intended session(s).

Do not break Phase 14A authentication integration.

## Tests

Add:

```text
Database does not store raw token
Valid refresh succeeds
Used token cannot be reused
Revoked token fails
Logout invalidates token
Malformed token fails safely
```

---

# PHASE 14B.6 — DATABASE MIGRATION & DEPLOYMENT STRATEGY

## Confirmed problem

No explicit migration/deployment strategy exists.

## Goal

Document and implement a safe, explicit migration process appropriate for a portfolio project.

Do not automatically run destructive migrations on every request.

Possible strategy:

```text
Deployment step:
dotnet ef database update
```

or another controlled migration mechanism already compatible with the project.

## Document

- migration creation
- local DB update
- deployment migration step
- rollback considerations
- backup expectations for destructive migrations

## Docker

Review docker-compose.

Ensure PostgreSQL health is checked before API dependency assumptions.

Add an API health check if appropriate.

## Production configuration validation

In Production, reject unsafe placeholder values such as:

```text
default JWT secret
default DB password
missing required critical configuration
```

Never print secret values.

## Environment template

Provide a useful `.env.example` or equivalent configuration reference containing placeholders only.

---

# PHASE 14B.7 — README & DEVELOPER DOCUMENTATION

## Goal

Replace scaffold documentation with a professional root `README.md` suitable for recruiters and engineers.

Required sections:

### 1. Project Overview

Explain what the product is, why it exists, and the main user experience.

### 2. Screenshots / Demo

Use real screenshots or clearly marked placeholders. Do not invent a live demo URL.

### 3. Features

List actual implemented features only, such as:

```text
Workspaces
Nested pages
Tiptap editor
Autosave/history
Search
Favorites/trash
Comments/sharing
Notifications
Files
AI
```

Do not claim real AI if production is still mock/demo mode.

### 4. Tech Stack

Separate Frontend and Backend.

### 5. Architecture

Include a concise diagram:

```text
Next.js
→ Zustand
→ Services
→ ASP.NET Core
→ EF Core
→ PostgreSQL
```

### 6. Repository Structure

Explain `frontend/` and `backend/`.

### 7. Local Setup

Document prerequisites, environment variables, database setup, Backend run, Frontend run.

### 8. Docker

Document the supported Docker workflow.

### 9. Database Migrations

Document migration commands.

### 10. AI Configuration

Explain real provider/mock behavior accurately.

### 11. Testing

List exact commands.

### 12. Security Highlights

Briefly describe JWT/refresh handling, authorization, upload validation, and secrets management.

### 13. Known Limitations

Be honest.

### 14. Future Improvements

Keep this concise.

---

# PHASE 14B.8 — PORTFOLIO PRESENTATION READINESS

## Goal

Make the repository easy to understand within a few minutes.

Verify the project demonstrates real Frontend skills:

```text
Next.js
React
TypeScript
Zustand
Tiptap
Complex UI
Responsive design
API integration
Error handling
```

and Backend skills:

```text
ASP.NET Core
EF Core
PostgreSQL
JWT
Authorization
REST
Testing
Docker
```

## Remove misleading claims

Do not claim:

```text
Production ready without evidence
True AI if only mock
Real-time collaboration if absent
Perfect security
Full Notion parity
```

## CV project description

Do NOT modify the user's CV.

Provide a recommended 3–5 bullet project description based only on actual implementation.

## Interview talking points

Generate concise talking points for:

```text
Why Zustand?
Why service layer?
Nested page hierarchy
Cycle prevention
JSONB editor persistence
Autosave/versioning
JWT/refresh
Centralized authorization
File validation
AI provider abstraction/security
Docker/test strategy
```

---

# PHASE 14B.9 — FINAL FULL-STACK VERIFICATION

## Frontend

Using the selected package manager:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Run TypeScript validation if needed.

## Backend

```bash
dotnet restore
dotnet build
dotnet test
```

## Repository hygiene

Verify:

- `bin/obj` are not tracked
- only one intended JS lockfile remains
- no real secrets are committed
- obsolete scaffold files are gone
- root README exists
- root `.gitignore` exists

## Configuration

Verify:

- development settings documented
- production placeholder secrets rejected
- migration workflow documented
- Docker configuration coherent

## Functional regression

Re-check Phase 14A critical flows:

```text
Auth refresh/logout
Role enforcement
Sharing
Editor/history
Public page
Uploads
Restore subtree
AI authorization
```

Do not assume Phase 14A remains correct after Phase 14B changes.

---

# OPTIONAL IMPROVEMENTS — DO NOT BLOCK PHASE 14B

The following are nice-to-have unless real performance requires them:

```text
PostgreSQL full-text search
Advanced pagination everywhere
Editor optimistic concurrency tokens
Version retention/coalescing
Aggressive Zustand optimization
Full accessibility automation
Large CSS/component splitting
Frontend Docker image
Cloud object storage
Multi-instance deployment
```

Report these separately as optional improvements.

---

# FINAL REPORT FORMAT

## 1. Executive Summary

```text
Repository hygiene:
Frontend validation:
Backend validation:
Test portability:
Notifications:
Refresh token security:
Migrations/deployment:
Documentation:
Portfolio readiness:
```

Use `Complete`, `Needs Fix`, or `Blocked`.

## 2. Repository Cleanup

List:

- files removed from tracking
- ignore rules added
- lockfile decision
- mocks/placeholders removed or retained

## 3. Validation Results

```text
Frontend install:
Frontend lint:
Frontend type-check:
Frontend tests:
Frontend build:

Backend restore:
Backend build:
Backend unit tests:
Backend integration tests:
```

Use exact results only.

## 4. CI Status

Report:

- workflow file
- checks
- DB service if used
- secret expectations

## 5. Notifications

Report actual event producers implemented.

## 6. Refresh Token Security

Report:

```text
Raw token storage?
Hashed token storage?
Rotation?
Reuse prevention?
Logout revocation?
```

## 7. Migration & Deployment Strategy

Explain local migration workflow, deployment workflow, configuration validation, Docker health/readiness.

## 8. Documentation

Confirm README sections completed.

## 9. Portfolio Readiness

Use:

```text
Recommended for CV: YES / NO
Recommended for GitHub public portfolio: YES / NO
Recommended for live demo: YES / NO
```

Explain remaining blockers.

## 10. Remaining Issues

Classify:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

## 11. Optional Future Improvements

List only genuinely optional items.

---

# FINAL PHASE 14B VERDICT

Use exactly one:

```text
PHASE 14B PASSED — READY FOR FINAL RE-AUDIT
```

or:

```text
PHASE 14B NEEDS MORE WORK
```

`PHASE 14B PASSED` requires:

- Phase 14A regressions remain fixed
- repository hygiene is acceptable
- frontend lint/test/build pass
- backend build/tests pass
- integration tests are portable
- notification feature has real producers where claimed
- refresh-token persistence is hardened
- migration/deployment workflow exists
- production placeholder secrets are rejected
- root README is professional and accurate
- no misleading portfolio claims remain

# START

Begin with:

```text
Phase 14B.0 — Baseline & Git Hygiene Audit
```

Then proceed:

```text
Inspect
→ Plan
→ Implement
→ Validate
→ Report
→ Continue
```

The goal is to prepare the project for one final independent full-stack audit that can return:

```text
PORTFOLIO READY
```
