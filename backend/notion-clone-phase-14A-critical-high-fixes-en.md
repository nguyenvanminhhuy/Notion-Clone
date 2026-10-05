# Notion Clone — Phase 14A: Critical & High Priority Fix Implementation

You are a **Senior Full-Stack Engineer, ASP.NET Core Architect, Security Engineer, React/Next.js Engineer, and QA Engineer**.

The latest full-stack audit verdict is:

```text
READY AFTER REQUIRED FIXES
```

Your task is to implement **Phase 14A — Critical & High Priority Fixes** without rebuilding the project or changing the established architecture.

## Core stack

Frontend: Next.js, React, TypeScript, Zustand, Tiptap, Tailwind CSS, centralized service/HTTP layer.

Backend: ASP.NET Core Web API, C#, EF Core, PostgreSQL, JWT + Refresh Tokens, role-based authorization, Swagger/OpenAPI, Docker, unit/integration tests.

---

# CRITICAL EXECUTION RULES

1. Fix only confirmed audit issues. Do not perform speculative refactoring.
2. Work sequentially and validate each phase before continuing.
3. Do not add microservices, CQRS, GraphQL, Redux migration, event sourcing, or unrelated features.
4. Backend authorization is authoritative. Frontend permission checks are UI only.
5. For every sub-phase: Inspect → Plan → Implement → Build → Test → Verify → Report → Continue.
6. If a major architectural conflict is discovered, STOP and report it instead of inventing a workaround.

Implement in this order:

```text
Phase 14A.0 — Baseline Verification
Phase 14A.1 — Authorization & Permission Enforcement
Phase 14A.2 — Frontend ↔ Backend Contract Fixes
Phase 14A.3 — Editor Autosave & Version History
Phase 14A.4 — Public Sharing
Phase 14A.5 — File Upload Security
Phase 14A.6 — Restore Page Subtree
Phase 14A.7 — AI Security & Provider Accuracy
Phase 14A.8 — Final Regression Verification
```

---

# PHASE 14A.0 — BASELINE VERIFICATION

Before modifying code:

- Inspect the current repository.
- Inspect the final full-stack audit report if available.
- Inspect current Frontend and Backend implementations.
- Confirm each audit finding still exists.
- Identify exact affected files and tests.

Create:

| Finding | Confirmed? | Frontend Files | Backend Files | Tests Affected |
|---|---:|---|---|---|
| Page authorization | | | | |
| Share authorization | | | | |
| Refresh/logout mismatch | | | | |
| HTTP method mismatch | | | | |
| Enum serialization | | | | |
| Editor autosave/history | | | | |
| Public sharing | | | | |
| File validation | | | | |
| Restore descendants | | | | |
| AI security/provider | | | | |

Do not modify code during this baseline step.

---

# PHASE 14A.1 — AUTHORIZATION & PERMISSION ENFORCEMENT

## Confirmed audit problems

- `Member` and `Guest` users can perform destructive page operations.
- Any workspace member can edit, move, archive, restore, permanently delete, publish, or share pages.
- `PageShare` roles are stored but not consistently enforced.
- Any workspace member may resolve comments.

This is a **CRITICAL broken-access-control issue**.

## Goal

Create a reusable, centralized permission model instead of scattering ad-hoc checks through services.

Prefer an abstraction such as:

```text
IPageAuthorizationService
```

or an equivalent consistent with the project.

Use existing roles/enums where possible. Likely role concepts include:

```text
Workspace: Owner / Admin / Member / Guest
Page: View / Comment / Edit / FullAccess
```

For every page operation evaluate permissions such as:

```text
CanRead
CanComment
CanEdit
CanMove
CanArchive
CanRestore
CanDeletePermanently
CanManageSharing
CanPublish
```

Review all operations affecting:

```text
Pages
Editor content
Move/reorder
Archive
Restore
Permanent delete
Comments
Sharing
Public publishing
Files
AI page context
```

## Required authorization regression tests

Use actors:

```text
Owner
Admin
Member
Guest
Shared Viewer
Shared Commenter
Shared Editor
Unrelated User
```

Test at minimum:

```text
Guest edits page
Guest permanently deletes page
Member changes share permissions
Viewer edits content
Viewer deletes page
Editor edits page
Editor changes sharing
Unrelated user reads page
Unrelated user edits page
```

Unauthorized actions must return the established `403` or `404` behavior.

Required outcome: simple workspace membership must never imply unrestricted page mutation rights.

---

# PHASE 14A.2 — FRONTEND ↔ BACKEND CONTRACT FIXES

## Confirmed mismatches

Refresh:

```text
Frontend: POST /api/auth/refresh-token
Backend:  POST /api/auth/refresh
```

Logout:

```text
Frontend: POST /api/auth/revoke-token
Backend:  POST /api/auth/logout
```

Workspace update:

```text
Frontend: PUT /api/workspaces/{id}
Backend:  PATCH /api/workspaces/{id}
```

Workspace member role update:

```text
Frontend: PUT /api/workspaces/{id}/members/{memberId}
Backend:  PATCH /api/workspaces/{id}/members/{memberId}
```

Enum serialization:

```text
Frontend expects strings such as Editor/Admin
Backend currently serializes enums numerically
```

## Goal

Make contracts fully consistent. Prefer adapting the Frontend service layer when Backend routes are intentionally correct.

Refresh must support:

```text
401
 ↓
single refresh request
 ↓
new access token
 ↓
retry original request
```

Prevent infinite refresh loops, concurrent duplicate refresh calls, and recursive refresh attempts.

Logout must revoke server-side refresh state where practical before local state is cleared.

Align all HTTP methods exactly.

For enums, prefer JSON string enums if that matches the existing Frontend. Inspect whether ASP.NET Core `JsonStringEnumConverter` is appropriate.

Verify:

```text
Workspace roles
Page permissions
Sharing roles
Invitation roles
Plan values
```

Add contract tests for refresh, logout, workspace PATCH, member-role PATCH, enum request serialization, and enum response serialization.

---

# PHASE 14A.3 — EDITOR AUTOSAVE & VERSION HISTORY

## Confirmed problem

Autosave currently uses page update behavior while version history is only generated through the dedicated content endpoint.

Target flow:

```text
Tiptap change
 ↓
Debounce
 ↓
pageService.updateContent()
 ↓
PUT /api/pages/{id}/content
 ↓
Persist JSONB
 ↓
Create PageVersion according to intended policy
 ↓
Show Saved only after success
```

Frontend requirements:

- use the content endpoint
- await save requests
- show `Saving`
- show `Saved` only after success
- surface failures
- safely handle pending saves on navigation/unmount
- do not send on every keystroke

Backend requirements:

- valid JSON
- sensible payload-size limit
- page existence
- edit permission

Verify:

```text
Edit
 ↓
Autosave
 ↓
Version created
 ↓
History endpoint
 ↓
Restore version
```

Add tests for autosave success/failure, PageVersion creation, history restore, unauthorized edit, invalid JSON, and oversized content.

---

# PHASE 14A.4 — PUBLIC SHARING

## Confirmed problem

Current public links point to an authenticated app route, while the Backend already has a public page endpoint.

## Goal

Create a true anonymous, read-only public-page flow:

```text
Authorized user
 ↓
Enable public sharing
 ↓
Copy public URL
 ↓
Anonymous visitor
 ↓
Public frontend route
 ↓
GET public API
 ↓
Read-only page
```

Frontend public route must:

- not require login
- use public API only
- render read-only content
- avoid private workspace/sidebar state
- not expose private workspace data

Backend must verify:

- page explicitly public
- private anonymous access denied
- public DTO excludes private metadata
- writes remain authenticated
- public-file behavior is intentional

Tests:

```text
Private page anonymous denied
Public page anonymous allowed
Disable sharing invalidates access
Public viewer cannot edit
No private workspace metadata leakage
```

---

# PHASE 14A.5 — FILE UPLOAD SECURITY

## Confirmed problems

- No strict MIME whitelist.
- No reliable magic-byte validation.
- Arbitrary extensions accepted.
- Backend trusts browser Content-Type.
- Frontend/Backend size limits differ.
- Stored URL/download route mismatch.
- Upload abuse protection is insufficient.

## Goal

Allow only required types, for example:

```text
PNG
JPEG
WEBP
GIF
PDF
```

Validate:

```text
Extension
MIME allowlist
Magic bytes/file signature
File size
Safe filename handling
```

Never trust original filename for storage paths. Keep randomized stored filenames.

Use one documented max-size policy across FE and BE.

Verify private file authorization and intentional public-file behavior.

Fix generated file URLs so they match the actual download endpoint identifier.

Add tests for:

```text
Valid PNG/JPEG/PDF
Executable renamed .png
Invalid MIME
Invalid extension
Oversized file
Path traversal filename
Unauthorized download
Authorized download
Public file behavior
```

---

# PHASE 14A.6 — RESTORE PAGE SUBTREE

## Confirmed problem

Deleting a page recursively archives descendants, but restoring the root does not restore the subtree consistently. Frontend can diverge from Backend state.

Preferred behavior:

```text
A
└── B
    └── C
```

Delete A:

```text
A archived
B archived
C archived
```

Restore A:

```text
A restored
B restored
C restored
```

unless an existing intentional product rule specifies otherwise.

Backend must be authoritative.

Frontend should update from Backend response or refetch tree/trash instead of inventing restored descendant state.

Tests:

```text
Root + children
Deep nesting
Restore root
Restore child
Mixed archived state
Unauthorized restore
Trash after restore
Tree after restore
```

---

# PHASE 14A.7 — AI SECURITY & PROVIDER ACCURACY

## Confirmed problem

Current `DefaultAiEngine` returns deterministic/template output rather than a real model response.

Additional issues:

- `PageId` access not consistently authorized
- client context is trusted
- arbitrary page association possible
- no prompt/output limits
- no provider timeout handling
- frontend tests use mocks
- frontend streaming is simulated

## Step 1 — Determine actual AI mode

Inspect code/configuration.

If OpenAI/Ollama integration already exists but is not wired, wire it correctly.

If no real provider exists, choose one of:

```text
Option A — Real provider integration
Option B — Explicit Mock/Demo AI labeling
```

Do NOT describe deterministic mock output as real AI.

Preserve:

```text
IAiService
 ↓
IAiEngine
 ↓
Provider
```

For requests referencing `PageId`:

1. Load page.
2. Identify workspace.
3. Verify authenticated permission.
4. Load authorized page context.
5. Send only allowed content to provider.

Do not trust client-supplied page content as authorization proof.

Add reasonable limits for prompt length, context length, output size, and conversation size.

Handle provider timeout, unavailability, rate limiting, invalid response, and cancellation.

Add tests for authorized/unauthorized page AI access, invalid PageId, oversized prompt, provider failure, timeout, rate limit, and API-key secrecy.

---

# PHASE 14A.8 — FINAL REGRESSION VERIFICATION

Backend:

```bash
dotnet restore
dotnet build
dotnet test
```

Frontend, using the repository-standard package manager:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

or equivalent npm commands if npm is the established standard.

Do not silently switch package managers.

Re-test full flows:

```text
Authentication: Register → Login → Auth API → Refresh → Logout
Authorization: Owner/Admin/Member/Guest/Shared Viewer/Shared Editor/Unrelated User
Pages: Create → Edit → Move → Archive → Restore subtree → Permanent delete
Editor: Load → Edit → Autosave → History → Restore → Browser refresh
Sharing: Private → Shared → Public → Permission removal → Anonymous access
Files: Valid upload → Invalid rejected → Authorized/unauthorized download
AI: Authorized → Unauthorized page → Provider success/failure → Limits
```

---

# DO NOT IMPLEMENT PHASE 14B HERE

Do not expand this phase into repository cleanup, README, package-manager cleanup, notification producers, CI, migration deployment strategy, refresh-token redesign, per-user favorites/recent modeling, broad performance work, browser E2E, accessibility polish, or component/CSS splitting unless one of these directly blocks Phase 14A.

---

# FINAL REPORT

Provide:

## 1. Executive Summary

```text
Authorization:
API contracts:
Editor/history:
Public sharing:
File security:
Restore subtree:
AI:
Regression tests:
```

Use `Fixed`, `Partially Fixed`, or `Blocked`.

## 2. Files Changed

Group by Frontend / Backend / Tests / Configuration.

## 3. Authorization Matrix

| Role | Read | Comment | Edit | Move | Archive | Permanent Delete | Manage Share | Publish |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Owner | | | | | | | | |
| Admin | | | | | | | | |
| Member | | | | | | | | |
| Guest | | | | | | | | |
| Shared Viewer | | | | | | | | |
| Shared Editor | | | | | | | | |

## 4. API Contract Verification

| Contract | Before | After | Status |
|---|---|---|---|
| Refresh | | | |
| Logout | | | |
| Workspace update | | | |
| Member role update | | | |
| Enum serialization | | | |

## 5. Editor Verification

```text
Autosave:
Version creation:
Save failure handling:
Pending-save handling:
Content validation:
```

## 6. Public Sharing Verification

```text
Anonymous public route:
Private-page protection:
Read-only enforcement:
Disable sharing behavior:
```

## 7. File Security Verification

```text
Allowed types:
Magic-byte validation:
Size limit:
Filename safety:
Private authorization:
Public behavior:
Generated URL validity:
```

## 8. AI Verification

```text
Mode: REAL PROVIDER / MOCK
Provider:
Page authorization:
Input limits:
Output limits:
Timeout:
Rate limiting:
Secret handling:
```

## 9. Exact Test Results

```text
Backend build:
Backend unit tests:
Backend integration tests:
Frontend lint:
Frontend tests:
Frontend build:
```

Do not fabricate unavailable results.

## 10. Remaining Issues

Classify as CRITICAL / HIGH / MEDIUM / LOW / INFO.

---

# FINAL VERDICT

Use exactly one:

```text
PHASE 14A PASSED
```

or:

```text
PHASE 14A NEEDS MORE WORK
```

`PHASE 14A PASSED` requires:

- no remaining CRITICAL Phase A issue
- no remaining HIGH Phase A issue
- authorization enforcement works
- FE/BE contracts match
- editor autosave/history works
- public sharing works
- file validation is hardened
- subtree restoration is consistent
- AI claims match actual implementation
- regression tests verify the fixes

# START

Begin with `Phase 14A.0 — Baseline Verification`, then continue sequentially.
