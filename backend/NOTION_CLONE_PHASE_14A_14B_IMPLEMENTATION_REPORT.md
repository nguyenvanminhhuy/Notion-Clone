# Notion Clone — Phase 14A/14B Implementation and Verification

Date: 2026-10-05 (Asia/Saigon)

Scope: implement the outstanding verdict items in the Phase 14A report and Phase 14B source review. This report records the current working tree; no commit or deployment to a public environment was made. The earlier reports remain historical baseline evidence, not the current verdict.

References:

- `notion-clone-phase-14A-critical-high-fixes-en.md`
- `notion-clone-phase-14B-portfolio-hardening-en.md`
- `NOTION_CLONE_PHASE_14A_REPORT.md`
- `NOTION_CLONE_PHASE_14B_SOURCE_REVIEW.md`

## 1. Executive summary

### Phase 14A

```text
Authorization: Fixed
API contracts: Fixed
Editor/history: Fixed
Public sharing: Fixed
File security: Fixed
Restore subtree: Fixed
AI: Fixed — explicitly Demo AI, not a real model integration
Regression tests: Fixed — executable frontend/backend checks now pass
```

### Phase 14B

```text
Repository hygiene: Complete
Frontend validation: Complete
Backend validation: Complete
Test portability: Complete
Notifications: Complete
Refresh token security: Complete
Migrations/deployment: Complete
Documentation: Complete
Portfolio readiness: Complete — ready for independent final re-audit
```

The previously unavailable frontend toolchain was supplied using temporary portable Node 22.23.3 and pnpm 10.34.6. Validation includes Windows and Linux backend tests, an isolated PostgreSQL database, a Linux Docker image build, explicit migration-bundle execution, and API smoke tests. This is not a claim of production readiness, a public deployment, or complete browser E2E coverage.

## 2. Changes and baseline findings closed

The Phase 14B.0 baseline table is preserved in the source review. The implementation closes its findings as follows:

| Review finding | Implementation |
|---|---|
| B01: unsafe production credentials | Startup validates required configuration and rejects known placeholder/default credentials without printing values. |
| B02: plaintext refresh tokens | SHA-256 token and replacement-token hashes; atomic rotation with an EF concurrency guard; legacy-session invalidation migration. |
| B03: broken Docker restore | Docker restores the API project/dependency graph, then publishes the API and a self-contained migration bundle. |
| B04: missing deployment migration step | Explicit Compose migration service; local EF tooling; backup and rollback documentation. |
| B05: archived public attachments | Anonymous file access requires both public and not archived, matching public page access. |
| B06: tracked generated artifacts | 1,602 generated files removed from the Git index; local build outputs preserved; root ignore policy added. |
| B07: competing package managers | pnpm pinned; npm lockfile removed; esbuild approval made explicit; frozen install passes. |
| B08: no notification producers | Workspace membership, registered-user page sharing, comments, and replies create scoped notifications. |
| B09: no PostgreSQL evidence | Isolated PostgreSQL migration, JSONB, FK, model consistency, and concurrent refresh verification added. |
| B10: missing CI/production-path tests | GitHub Actions and frontend HTTP/autosave/service-contract tests added. |
| B11: missing documentation | Root README and deployment guide added; scaffold frontend README replaced. |
| B12: stale state after child restore | Active tree and trash refetched from backend after restore/undo. |
| B13: liveness-only health | Separate database/schema readiness endpoint and Docker health check. |
| B14: misleading rate-limit scope | Actual global IP limiter, auth IP partition, and authenticated-user AI partition. |
| B15: obsolete scaffolds/mocks | Unused scaffolds and mock chains removed; used AI test fixture retained. |
| B16: unsupported quality claim | Removed the production-grade claim; documentation states actual limitations. |

Additional frontend blockers discovered during execution were fixed without disabling lint rules: stale effect dependencies, callbacks referenced before initialization, impure render-time clock use, JSX escaping, and state synchronization patterns. Autosave is now serialized so a slow earlier request cannot overwrite a later edit. History restoration waits for pending saves and remounts the editor with restored content.

### Main files changed

- Frontend: `src/features/editor/{Editor.tsx,autosave.ts,EditorSaveStatus.tsx,FloatingToolbar.tsx}`, `src/features/page/{PageView.tsx,PageHistoryModal.tsx}`, `src/stores/pageStore.ts`, `src/services/{api/httpClient.ts,fileService.ts,pageService.ts}`, command palette and related lint-blocking UI components.
- Backend: `AuthService.cs`, `AiService.cs`, `FileService.cs`, `EventNotifications.cs`, workspace/share/comment services, `ProductionConfiguration.cs`, `NotionDbContext.cs`, model snapshot, migration `20261005060000_HashRefreshTokenStorage.cs`, `Program.cs`, health and share controllers.
- Tests: frontend `autosave.test.ts`, `httpClient.test.ts`, `contracts.test.ts`; backend `Phase14BHardeningTests.cs`, `PostgresPersistenceTests.cs`, `RateLimitTests.cs`, file/security regressions and test-host configuration; `scripts/smoke.ps1`.
- Configuration/documentation: root `.gitignore`, `README.md`, frontend package/config/env files, `.github/workflows/ci.yml`, backend Docker/Compose/local EF tool manifest, `docs/DEPLOYMENT.md`.

## 3. Repository cleanup

- Untracked only the validated project `bin/` and `obj/` directories using Git index removal. Final `git ls-files` check finds **0** generated files in those directories. They were not recursively deleted from disk.
- Added ignore rules for .NET/Node build outputs, local secrets, uploads, IDE state, coverage, and logs. Example environment files remain allowed.
- Selected **pnpm 10.34.6** and retained `frontend/pnpm-lock.yaml` as the sole JavaScript dependency lockfile. Removed the conflicting `package-lock.json`.
- Removed three empty `Class1.cs` files and two empty `UnitTest1.cs` tests.
- Removed eight unused frontend mock service/data modules. Retained `mockAIService.ts` because existing fixture tests import it; production AI calls still use the real API service.
- Centralized file URLs through the HTTP client's configured API origin. Production frontend configuration does not silently fall back to localhost; development retains a documented default.
- Reviewed current configuration: checked-in credentials are development defaults, placeholders, or clearly test-only fixture values. No real production secret was identified in the inspected changes. This is **not** an exhaustive historical secret scan.
- Generated-file and npm-lockfile removals are staged because index cleanup requires it. Other source changes are not automatically staged or committed.

## 4. Exact validation results

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile accepted without updates. |
| `pnpm lint` | PASS; 0 errors, 23 unused-variable/import warnings. |
| `pnpm typecheck` | PASS. |
| `pnpm test` | PASS; 6 files, 22 tests, 0 failed. |
| `pnpm build` | PASS; optimized Next.js build, including `/page/[pageId]` and `/public/[pageId]`. |
| `dotnet restore NotionClone.sln` | PASS. |
| `dotnet build NotionClone.sln --no-restore` | PASS; 0 warnings, 0 errors. |
| Windows unit tests | PASS; 41 passed, 0 failed, 0 skipped. |
| Windows integration tests, PostgreSQL configured | PASS; 40 passed, 0 failed, 0 skipped. |
| Linux SDK-container unit tests | PASS; 41 passed, 0 failed, 0 skipped. |
| Linux SDK-container integration tests, PostgreSQL configured | PASS; 40 passed, 0 failed, 0 skipped. |
| Docker API image build | PASS; final verification image `notionclone-api:phase14-verify`. |
| Compose configuration | PASS with explicit test configuration. |
| Fresh-database migration bundle | PASS; all three migrations applied as the non-root container user. |
| API readiness | PASS; 503 before migrations, 200 after migrations. |
| Container API smoke script | PASS; auth, roles, content/history, public sharing, files, restore, Demo AI, notifications. |
| Git whitespace checks | PASS; working-tree and staged diffs. |

Frontend tests were rerun after the final callback corrections. The final production build also passed after those changes.

The PostgreSQL fact uses `NOTION_TEST_POSTGRES`, creates a uniquely named disposable database, and drops only that database afterward. Without this variable it reports an explicit skip; it does not silently claim PostgreSQL coverage. Most HTTP integration tests intentionally retain the fast EF InMemory host. The separate PostgreSQL fact covers the database-specific behavior listed above.

Linux verification used the .NET 8 SDK image, a read-only source mount, and a temporary artifacts path. Windows test logging remains console/test-only rather than relying on Event Log permissions.

Verification used only disposable test containers/databases, not the user's application database or named volumes. The temporary API/PostgreSQL containers and their dedicated network were removed afterward; their test data is discarded. The local verification image and temporary portable toolchain remain available as caches.

## 5. Phase 14A authorization and API contracts

Backend permissions remain authoritative. Workspace membership is evaluated before explicit page sharing; a page share does not elevate an existing workspace member's role.

| Role | Read | Comment | Edit | Move | Archive | Permanent delete | Manage share | Publish |
|---|---|---|---|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Member | Yes | Yes | Yes | Yes | Yes | No | No | No |
| Guest | Yes | Yes | No | No | No | No | No | No |
| Shared Viewer | Yes | Yes | No | No | No | No | No | No |
| Shared Editor | Yes | Yes | Yes | No | No | No | No | No |
| Unrelated user | No | No | No | No | No | No | No | No |

Owner/Admin/Member may restore; Guest may not. Shared Editor does not receive move/archive/restore rights. The existing domain has no separate Shared Commenter role; Viewer includes commenting. These are the project's implemented policies, not a claim of exact Notion parity.

| Contract | Historical mismatch | Verified current contract |
|---|---|---|
| Refresh | `/refresh-token` | `POST /api/auth/refresh`; concurrent 401s coordinate a single refresh and retry. |
| Logout | `/revoke-token` | `POST /api/auth/logout`; server-side refresh state revoked. |
| Workspace update | PUT | `PATCH /api/workspaces/{id}`. |
| Member role update | PUT | `PATCH /api/workspaces/{id}/members/{memberId}`. |
| Enums | Numeric/string mismatch | String JSON enums; backend API tests and frontend contracts cover the mappings. |
| Editor content | General page update | `PUT /api/pages/{id}/content`. |
| Trash | Client-inferred cache | `GET /api/trash?workspaceId=...`, with authoritative refetch after restore. |

Swagger response DTO annotations now match public and publish-toggle responses.

## 6. Editor, public sharing, files, and AI verification

### Editor/history

- One-second debounced content saves, serialized writes, awaited completion, and failure reporting.
- Save status is reset when saving begins and shown as Saved only following success.
- Unmount flushes pending work with handled errors. History restore explicitly settles pending work; a failed save blocks restoration rather than silently losing it.
- History restore updates cache and editor content; versions persist through the dedicated endpoint.
- Backend validates JSON, a 1 MiB content limit, existence, and edit permissions.
- Tests cover successful/latest save, overlapping writes, failed unmount save, restore preflight failure, backend versions, invalid/oversized content, and role enforcement.

### Public sharing and files

- Anonymous public route uses public API data and a read-only editor; no private sidebar/workspace response metadata.
- Private pages deny anonymous access; disabling publishing invalidates public access.
- Anonymous attachments are available only while their parent is public **and not archived**. Archive regression is covered in tests and container smoke checks.
- Upload policy remains PNG/JPEG/WEBP/GIF/PDF, extension/MIME/signature validation, randomized storage names, and a shared 20 MiB size limit.
- Existing upload tests and smoke checks verify valid uploads, mismatched/renamed payload rejection, private authorization, public behavior, and actual download identifiers.
- Tree/trash reload after restoring either a root or a child includes backend-restored ancestors and descendants.

### AI

```text
Mode: MOCK / explicitly labeled Demo AI
Provider: DefaultAiEngine, deterministic output; no real external model wired
Page context: loaded server-side after read authorization
Prompt limit: 4,000 characters
Context limit: 20,000 characters
Output limit: 8,000 characters
Conversation limit: 100 stored messages
Provider timeout: 30 seconds by default; cancellation-aware and enforced even for a non-cooperative engine
Rate limiting: 30 requests/minute per authenticated user; global IP limit also applies
Secret handling: no external provider API key is required or claimed
```

Regression tests exercise authorization, invalid IDs, limits, provider failures, timeout, cancellation, and independent user rate-limit partitions. Demo output and simulated frontend streaming are not presented as real AI/provider streaming.

## 7. Notification producers

- Adding a registered user to a workspace creates a System notification.
- Sharing a page with a registered target user creates a Share notification.
- New top-level comments notify the page creator; replies notify the parent-comment author, subject to current page-read authorization.
- Self-notifications are suppressed; messages are generic and links target the page.
- Notification entities are persisted with the business action in the same DbContext save, avoiding a separate best-effort write.
- Tests cover producers, recipient isolation, self suppression, unread counts, read updates, and mark-all-read behavior.

Mentions, email delivery, and notifications to unregistered email invitees were not invented. They remain unsupported rather than misleadingly advertised.

## 8. Refresh-token security

```text
Raw token storage: No for newly issued sessions
Hashed token storage: SHA-256, including replacement references
Rotation: Yes; old-token revocation and replacement insertion saved together
Concurrent rotation: EF concurrency guard; only one refresh succeeds
Reuse prevention: Yes; used/revoked token rejected
Logout revocation: Yes; idempotent for an already-revoked session
Malformed tokens: Rejected safely
```

Migration `20261005060000_HashRefreshTokenStorage` revokes existing refresh sessions and replaces legacy token values with non-secret invalidation markers. It does not delete users or documents. **Deploying this migration requires users to sign in again once their existing access tokens expire.** Its data invalidation is intentionally not reversible by a Down migration; rollback requires an appropriate backup, not reconstruction of raw credentials.

Tests verify persisted hashes differ from raw tokens, replacement hashes, sequential reuse rejection, logout, malformed input, and a real PostgreSQL two-request rotation race. Full token-family revocation remains optional future work; it is not claimed here.

## 9. Migration, deployment, and CI

- Local EF tool is pinned in `backend/.config/dotnet-tools.json`; documented workflow uses `dotnet tool restore` and explicit `dotnet ef database update` with the infrastructure/startup projects.
- Docker builds `/app/efbundle`; Compose waits for PostgreSQL health, runs the migration service, and starts the API only after migration success.
- Migration-bundle extraction is directed to a writable `/app/.bundle` path. Verification exposed and fixed the default non-root extraction-path failure.
- `/api/health` is liveness; `/api/health/ready` checks connectivity and pending migrations, returning safe 503 responses when not ready.
- Production startup rejects missing/short/recognized placeholder JWT secrets, invalid/default database passwords, and missing CORS origins. Secrets are not included in validation errors.
- `backend/docs/DEPLOYMENT.md` covers configuration, migrations, backups, rollback, readiness, and disposable smoke tests. No destructive migration runs on ordinary requests.

Workflow: `.github/workflows/ci.yml`.

- Frontend Ubuntu job: pinned pnpm/Node, frozen install, lint, typecheck, tests, build.
- Backend Ubuntu job: .NET 8 restore/build/tests with PostgreSQL 16 service, followed by Docker build.
- Backend Windows job: .NET tests, without requiring Event Log permissions; PostgreSQL-specific fact explicitly skips when not configured.
- CI database credentials are disposable test-only values, not deployment secrets. Production configuration must be supplied outside source control.
- Workflow has been added but **has not been run on GitHub** during this task. Local Windows/Linux/container results are the evidence reported here.

## 10. Documentation and portfolio readiness

The root README includes all 14 requested sections: overview, screenshots/demo, actual features, stack, architecture, structure, local setup, Docker, migrations, AI configuration, testing, security highlights, limitations, and future improvements. Screenshot slots are clearly marked pending; no live URL was invented.

```text
Recommended for CV: YES — with the factual description below
Recommended for GitHub public portfolio: YES — after reviewing and committing the working tree
Recommended for live demo: NO — a public environment, TLS/origin configuration, and browser smoke verification are still required
```

### Suggested CV description (no CV file modified)

- Built a full-stack workspace and nested-document application with Next.js, TypeScript, Zustand, Tiptap, ASP.NET Core, EF Core, and PostgreSQL.
- Implemented centralized role/page authorization, anonymous read-only publishing, validated file uploads, and JWT authentication with hashed rotating refresh tokens.
- Added debounced serialized editor saves, JSONB content persistence, version history, subtree restoration, and user-scoped event notifications.
- Verified API behavior with unit/integration tests and isolated PostgreSQL checks; added portable CI, Docker migration sequencing, readiness checks, and deployment documentation.

### Interview talking points

- Zustand keeps cross-component workspace/page state small; the service layer separates UI state from HTTP contracts and token recovery.
- Parent IDs model nested pages; backend cycle checks and authoritative restore/refetch avoid impossible trees and divergent client state.
- JSONB persists Tiptap documents; debouncing limits requests, serialized writes preserve ordering, and a dedicated endpoint creates versions.
- Central authorization maps workspace and page roles to explicit operations instead of treating membership as unrestricted write permission.
- Refresh-token hashes reduce database credential exposure; atomic rotation and concurrency checks prevent two successful replacements.
- File validation combines size, extension, MIME, signatures, randomized paths, and permission-checked downloads.
- The AI abstraction separates authorization/limits from provider execution; the currently configured engine is honestly labeled Demo AI.
- Fast HTTP tests complement real PostgreSQL checks; Docker applies migrations explicitly and reports schema readiness separately from liveness.

## 11. Remaining issues and limits

- **CRITICAL/HIGH:** none identified in the implemented Phase 14A/14B scope by the checks recorded here. This does not establish perfect security.
- **LOW:** 23 frontend unused-variable/import lint warnings remain; lint exits successfully. No lint rule was disabled to achieve that result.
- **INFO:** no automated browser E2E or visual/accessibility validation was executed. Unit/service tests and API smoke tests do not prove every rendered interaction or browser-refresh/navigation edge case.
- **INFO:** GitHub workflow execution, real screenshots, public hosting, TLS/reverse-proxy setup, and independent final re-audit remain to be completed before advertising a live deployment.
- **INFO:** historical secret scanning and provider-specific error/API-key validation for a future real AI integration were not performed.

Optional future work: browser E2E, accessibility automation, token-family reuse response, editor optimistic concurrency/version retention, real AI provider integration, cloud file storage, and multi-instance deployment. These are not represented as implemented features.

## 12. Final verdicts

```text
PHASE 14A PASSED
PHASE 14B PASSED — READY FOR FINAL RE-AUDIT
```

These verdicts cover the requested implementation and recorded checks. The next gate is an independent full-stack re-audit, not an unsupported declaration of production readiness.
