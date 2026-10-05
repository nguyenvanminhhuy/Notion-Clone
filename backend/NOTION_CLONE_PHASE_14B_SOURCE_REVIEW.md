# Notion Clone — Phase 14B Source Review

Date: 2026-10-05 (Asia/Saigon)  
Reviewed commit: `dcc85c4`, with current working-tree source.  
Reference: `notion-clone-phase-14B-portfolio-hardening-en.md`.

Scope: source review and diagnostic verification. No application fixes, Git index cleanup, package installation, or database changes were performed. This report assesses the prompt's implementation requirements; it does not claim they were implemented during this review. Backend validation regenerated tracked build outputs.

## 1. Executive Summary

```text
Repository hygiene: Needs Fix
Frontend validation: Blocked
Backend validation: Complete
Test portability: Needs Fix
Notifications: Needs Fix
Refresh token security: Needs Fix
Migrations/deployment: Needs Fix
Documentation: Needs Fix
Portfolio readiness: Needs Fix
```

Backend restore/build/tests pass on this Windows environment. The test host already clears OS-specific logging providers. However, most Phase 14B requirements remain open. Passing EF InMemory tests does not establish PostgreSQL or container deployment readiness. Frontend validation cannot execute because Node/npm/pnpm/corepack are unavailable on PATH.

### Prioritized findings

| ID | Severity | Finding | Evidence | Required correction |
|---|---|---|---|---|
| B01 | HIGH | Production accepts known placeholder signing credentials and default DB password | `docker-compose.yml:36–45`, `src/NotionClone.Infrastructure/DependencyInjection.cs:21–29`, `src/NotionClone.Api/Program.cs:8–11` | Require production secrets and reject missing, short, or recognized placeholder values before startup. Do not print values. |
| B02 | HIGH | Refresh tokens and replacement tokens are persisted raw | `src/NotionClone.Infrastructure/Services/AuthService.cs:63,73,82,108` | Store hashes for both token references; hash incoming tokens for lookup; define an existing-session migration/invalidation policy. |
| B03 | HIGH | Docker build restores test projects that are absent from its build stage | `Dockerfile:6–13`; solution test references at `NotionClone.sln:18,20` | Restore the API project and its dependency graph explicitly, or copy every referenced project before solution restore. |
| B04 | HIGH | Fresh database deployment has no schema application step | Existing EF migrations; Docker entrypoint only runs the API; no migration runner/startup migration/deployment workflow found | Add a controlled migration step or migration bundle and document sequencing, backups, and rollback. |
| B05 | HIGH | Archiving a public page leaves its attachments anonymously downloadable | `src/NotionClone.Infrastructure/Services/FileService.cs:109`; page archive retains `IsPublic`; public page query requires `!IsArchived` at `ShareService.cs:150` | Make anonymous file access use the same public-and-not-archived predicate as public page access; test public → archive → anonymous download. |
| B06 | MEDIUM | 1,602 generated `bin/obj` files remain tracked; root ignore file is absent | `git ls-files`, repository root inspection | Remove only generated paths from tracking while preserving local files; add root ignore rules. |
| B07 | MEDIUM | Package manager is ambiguous and pnpm configuration contains an unresolved placeholder | Both `frontend/package-lock.json` and `frontend/pnpm-lock.yaml`; `frontend/pnpm-workspace.yaml:2` | Confirm one manager, pin it, resolve `esbuild` build approval to a deliberate boolean, remove the conflicting lockfile, and run a frozen install. |
| B08 | MEDIUM | Notifications have no production event producers | Only `NotificationService` creates notification entities; workspace/share/comment services never call creation | Persist notifications with supported business actions and test recipients, self-noise prevention, and isolation. |
| B09 | MEDIUM | Integration tests do not cover production database behavior | `tests/NotionClone.IntegrationTests/NotionCloneWebApplicationFactory.cs:79` replaces Npgsql with EF InMemory | Retain fast HTTP tests but add isolated PostgreSQL verification for migrations, JSONB, FK/cascade/restrict behavior, and token rotation consistency. |
| B10 | MEDIUM | No CI workflow; frontend tests largely avoid the live service/editor paths | No `.github/workflows` files; `frontend/src/__tests__/aiService.test.ts:2`; page-tree helpers are defined inside the test file | Add CI and meaningful frontend coverage for HTTP refresh/retry, autosave/history, anonymous pages, and production service mappings. |
| B11 | MEDIUM | No root README or complete operational/deployment documentation | Root directory; scaffold `frontend/README.md` | Add the prompt's README sections and accurate setup, configuration, migration, Docker, testing, and limitations guidance. |
| B12 | MEDIUM | Child restoration can leave frontend ancestors stale | Backend restores ancestors in `PageService.RestorePageAsync`; `frontend/src/stores/pageStore.ts:210–221` updates only the root and descendants | Refresh tree/trash after restoration or apply an authoritative response covering every changed page. |
| B13 | MEDIUM | API health does not report database readiness | `src/NotionClone.Api/Controllers/HealthController.cs:10–17` always returns Healthy | Distinguish liveness from readiness; check database reachability/schema readiness and configure an API health check. |
| B14 | MEDIUM | Rate-limit scope is inconsistent with the previous Phase 14A report | `src/NotionClone.Api/Program.cs:65–88,122–123` uses named fixed-window limiters without user/IP partitioning | Correct the documented scope or configure explicit partitions and suitable middleware order. The current AI bucket is shared across callers; the named global limiter is not a configured global limiter. |
| B15 | LOW | Scaffold files and obsolete mocks obscure the production implementation | Three empty `Class1.cs`, two empty `UnitTest1.cs`; frontend mock import search | Remove only unused scaffolds/fixtures after checking imports; preserve test doubles. |
| B16 | LOW | Unsupported production-quality claim remains | `src/NotionClone.Api/Program.cs:24` says “Production-grade” | Replace with an accurate project description until production deployment/security evidence exists. |

These are source-confirmed findings except that the exact pnpm install outcome is untested. Docker build failure is inferred directly from the build-stage file set and solution references; an image build was not executed. B05 and B12 are additional Phase 14A gaps uncovered during this review, not changes introduced by Phase 14B work.

### Phase 14B.0 baseline

| Area | Current state | Problem | Planned action |
|---|---|---|---|
| `.gitignore` | Frontend ignore and backend Docker ignore exist | No root Git ignore; frontend ignores all `.env*`, including a potential example | Add root policy and retain example configuration explicitly. |
| `bin/obj` | 1,602 of 1,832 tracked files | Builds dirty the worktree and inflate the repository | Untrack validated generated paths without deleting local outputs. |
| Lockfiles | npm and pnpm files both tracked | No `packageManager` pin; intended manager unresolved | Confirm and pin one manager, then frozen install. |
| Scaffold files | Three `Class1.cs`, two `UnitTest1.cs` | No useful implementation/test behavior | Remove verified unused files. |
| Mocks | Separate frontend mock directory; production services call HTTP | Most mock modules are not imported outside the mock directory | Preserve `mockAIService` as a test fixture until its tests migrate; classify remaining unused chains. |
| Frontend tests | Three test files, 11 test declarations | AI tests exercise an old mock; tree helpers exist only in tests; search exercises local fallback | Cover production paths and execute lint/types/tests/build. |
| Backend integration tests | InMemory HTTP host with console logging | No PostgreSQL/migration verification or Linux runner evidence | Add PostgreSQL coverage and CI; retain logging fix. |
| Notifications | User-scoped APIs/UI and creation service | No supported actions create notifications | Add business-event producers with consistent saves. |
| Refresh tokens | Random tokens with revoke/rotation flags | Raw values in `Token` and `ReplacedByToken`; no concurrency guard | Hash persistence and test rotation/reuse; evaluate concurrent refresh. |
| Migrations | InitialCreate and AddRefreshTokens exist | No controlled execution workflow | Document and automate an explicit deployment step. |
| README | Generic frontend scaffold README | No root product/architecture/setup guide | Write accurate root documentation. |
| Deployment docs | Compose, Dockerfile, `.env.example`, design/specification documents | Build-stage defect, unsafe defaults, no migration workflow/readiness | Correct artifacts and verify fresh deployment. |

## 2. Repository Cleanup

No cleanup was performed during this review.

- Files removed from tracking: none. Generated tracked paths: **1,602**.
- Ignore rules added: none. Root `.gitignore` is missing.
- Lockfile decision: unresolved. pnpm-specific artifacts suggest use of pnpm, but both lockfiles and a README listing several managers do not establish one authoritative choice.
- Placeholder files: `backend/src/{NotionClone.Application,NotionClone.Domain,NotionClone.Infrastructure}/Class1.cs` and both test projects' `UnitTest1.cs` remain. Each test total includes an empty scaffold test.
- Mocks retained: all. Only `mockAIService` is imported from outside the mock directory, by its tests. The remaining mock services/data form unused fixture chains in the inspected production source; confirm intended demo use before removal.
- Runtime localhost fallbacks remain in `frontend/src/services/api/httpClient.ts:23`, `fileService.ts:53,135`, and backend connection/CORS defaults. Development defaults are reasonable only with documented configuration and safe production validation.
- Secret inspection identified checked-in development/placeholder credentials; this review did not establish any real production secret or scan all historical commits. No secret values are reproduced here.

## 3. Validation Results

Executed during this review:

```text
Frontend install: BLOCKED — node/npm/pnpm/corepack not found on PATH.
Frontend lint: BLOCKED — not executed.
Frontend type-check: BLOCKED — not executed.
Frontend tests: BLOCKED — not executed.
Frontend build: BLOCKED — not executed.

Backend restore: PASS — all projects up to date.
Backend build: PASS — 0 warnings, 0 errors.
Backend unit tests: PASS — 38 passed, 0 failed, 0 skipped.
Backend integration tests: PASS — 38 passed, 0 failed, 0 skipped.

Docker Compose config: PASS — exit 0; obsolete version-key warning.
Docker image build: NOT RUN — source review identifies B03.
PostgreSQL migrations/database regression: NOT RUN.
Linux/CI test execution: NOT RUN.
```

Commands: `dotnet restore NotionClone.sln`, `dotnet build NotionClone.sln --no-restore`, `dotnet test NotionClone.sln --no-build --no-restore` from `backend/`; `docker compose -f backend/docker-compose.yml config --quiet` from the root. Restore and Compose validation were rerun with approval to read user-level configuration denied by the sandbox. Compose validation checks configuration syntax, not build success or application readiness.

### Phase 14A regression assessment

- Refresh/logout, permission restrictions, editor backend persistence/history, sharing/public DTO, upload signatures/authorization, subtree restoration, and AI authorization have passing existing backend coverage.
- Frontend autosave, navigation flush, public rendering, and token refresh coordination remain unexecuted.
- B05 shows anonymous attachments remain accessible after archiving a public page. Existing tests do not cover that transition.
- B12 shows child restore updates backend ancestors but not their frontend cached state. Existing restore coverage verifies root restoration only.
- The prior Phase 14A report's claim that AI rate limits use an authenticated partition is incorrect for this source. B14 records the actual configuration. The prior report's passed backend tests remain valid, but they do not prove these uncovered cases.

## 4. CI Status

- Workflow file: none found.
- Checks: not configured.
- Database service: none in CI; current integration fixture uses InMemory.
- Secret expectations: proposed CI should use dedicated test credentials and disposable databases; never production credentials.

A practical workflow should pin the JS manager, install from its lockfile, run lint/types/tests/build, and restore/build/test .NET. Add PostgreSQL-backed coverage before claiming database integration verification. CI should use a matrix or other explicit evidence if both Windows and Linux portability are claimed.

## 5. Notifications

Actual production event producers found: **none**.

`WorkspaceService.AddMemberAsync`, `ShareService.SharePageAsync`, and both comment creation paths save business records without notifications. `NotificationService.CreateNotificationAsync` is used by tests, with no production callers found. Read/count/mark/delete operations correctly filter by target user in source, and the existing lifecycle test verifies unread count and marking behavior; cross-user isolation and event producers lack tests.

Supported enums are Comment, Mention, Share, System. Workspace membership can use an appropriate existing System notification; shares can use Share; comments/replies can use Comment. No actual mention parser/resolution was found. Workspace “invitation” currently adds an existing registered user directly, so documentation must not claim an email-delivery or invitation-acceptance workflow.

Recommended implementation: derive recipients from authorized business state, skip actor notifications, and add notification records to the same DbContext save as the action. Do not notify an unregistered email as though it were an existing user.

## 6. Refresh Token Security

```text
Raw token storage? YES — Token and ReplacedByToken store client token values.
Hashed token storage? NO.
Rotation? YES — old token revoked and a new token returned.
Reuse prevention? Sequential reuse is rejected by IsActive; no dedicated reuse test found.
Logout revocation? YES — integration test passes.
Concurrent refresh safety? Unverified; no concurrency token or conditional atomic revoke found.
Malformed token handling? Existing invalid-token integration test passes.
```

Random token generation uses 64 cryptographically random bytes. Hashing high-entropy token values is compatible with the existing architecture. Both lookup and replacement references need a consistent hash policy. Existing plaintext rows must be migrated safely or sessions explicitly invalidated. Rotation uses multiple saves and no explicit concurrency guard, so two simultaneous requests may each observe the old token as active; add a real relational test before asserting one-time concurrent consumption.

## 7. Migration & Deployment Strategy

Migrations exist, but no explicit local/deployment migration procedure, migration job/bundle, backup guidance, or rollback instructions were found. The API does not run migrations. Starting Compose against a new database therefore does not create the application schema.

Recommended workflow: pin `dotnet-ef` with a local tool manifest; document migration creation and database update using the Infrastructure project with the API startup project; apply reviewed migrations as a separate deployment step before starting the API. A bundle/job is appropriate for the runtime image, which has no SDK. Back up data before destructive changes; evaluate rollback from migration Down operations and schema compatibility rather than treating rollback as universally safe.

PostgreSQL already has a Compose health check, and the API depends on `service_healthy`. This proves server availability only, not application schema readiness. The API's health action unconditionally reports Healthy and Compose has no API health check. Production validation does not reject placeholder JWT/DB values. `backend/.env.example` exists, but there is no frontend environment template or complete setup guide.

## 8. Documentation

Root README: **missing**. Frontend README: create-next-app scaffold.

The prompt's fourteen required root sections are not completed: overview, demo/screenshots, real features, stack, architecture, structure, local setup, Docker, migrations, AI mode, tests, security, limitations, future work. No live demo URL or real screenshot evidence was verified.

The README should clearly state deterministic Demo AI and simulated response animation. Existing UI demo labeling is accurate; do not describe it as a real model or true server streaming. Document notification producers as unfinished and avoid unsupported production-ready/full-Notion-parity/real-time collaboration claims.

## 9. Portfolio Readiness

```text
Recommended for CV: YES — as a development project, with accurate bounded claims.
Recommended for GitHub public portfolio: NO — until hygiene/documentation and validation gaps are resolved.
Recommended for live demo: NO — until deployment, credential, schema, and public-file findings are fixed and verified.
```

Suggested CV bullets based on current source:

- Built a workspace application with Next.js, React, TypeScript, Zustand, and a Tiptap rich-text editor backed by ASP.NET Core APIs.
- Implemented nested pages, move-cycle prevention, editor content snapshots/history, search, comments, sharing, and file attachments.
- Added centralized page permissions, JWT authentication with refresh-token rotation, and MIME/extension/signature validation for uploads.
- Developed .NET unit and HTTP integration tests and a layered EF Core/PostgreSQL persistence design; isolated HTTP tests currently use EF InMemory.

Interview talking points:

| Topic | Evidence-backed discussion |
|---|---|
| Zustand | Shared workspace/page/UI state; explain synchronization with server state and cached-state failure cases. |
| Service layer | Central HTTP transport, token retry, DTO mapping, and separation from UI components. |
| Hierarchy/cycles | ParentId relationships, descendant traversal, and move-cycle validation. |
| JSONB | Structured Tiptap JSON stored in PostgreSQL JSONB; relational behavior needs separate verification. |
| Autosave/history | Debounced content endpoint, awaited save status, snapshots, and version restoration. |
| JWT/refresh | Short-lived access tokens, random refresh tokens, rotation/logout; hashing and concurrent consumption are open work. |
| Authorization | Central operation permissions based on workspace roles or page shares. |
| Files | Size, extension, MIME, signatures, randomized keys, authorized downloads; archived public access needs correction. |
| AI | IAiEngine abstraction, Demo AI honesty, server-authorized page context and limits. |
| Docker/tests | Multi-stage API image, PostgreSQL health dependency, console test logging; discuss build/migration/readiness gaps candidly. |

## 10. Remaining Issues

- CRITICAL: no observed active production deployment/incident established in this review. Known signing-secret defaults would permit forged tokens if deployed unchanged; B01 must block public deployment.
- HIGH: B01–B05; frontend Phase 14A behavior is also unverified and remains a release gate.
- MEDIUM: B06–B14; CI, PostgreSQL verification, notifications, package-manager consistency, documentation, restore synchronization, and limiter scope.
- LOW: B15–B16; unused scaffolds/fixtures and unsupported quality wording.
- INFO: backend logging portability fix already exists; one empty scaffold test is included in each reported backend total; Compose version-key warning is cosmetic.

Implement in the prompt's sequence after recording this baseline, with a regression check at each step. No major architecture change is required to address the findings.

## 11. Optional Future Improvements

- PostgreSQL full-text search if search volume warrants it.
- Version retention/coalescing and editor concurrency control.
- Cloud file storage when deploying beyond a single instance.
- More accessibility automation and a frontend Docker image.

These do not replace the required fixes above.

## Final Phase 14B Verdict

```text
PHASE 14B NEEDS MORE WORK
```

Backend checks pass, but the repository does not yet meet the prompt's hygiene, frontend verification, notification, token persistence, deployment, documentation, and portfolio requirements.
