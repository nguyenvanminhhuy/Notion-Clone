# Notion Clone — Phase 13: Frontend ↔ ASP.NET Core Backend Integration

You are a Senior Full-Stack Engineer specializing in Next.js, React, TypeScript, Zustand, ASP.NET Core, REST APIs, authentication, and production integration.

The Notion Clone already has a completed Next.js Frontend and a completed ASP.NET Core Backend with PostgreSQL, EF Core, JWT + Refresh Tokens, workspace/page authorization, editor persistence, search, favorites, trash, comments, sharing, notifications, file upload, AI, Docker, and backend tests.

The task is to integrate the existing Frontend with the existing Backend.

# 0. IMPORTANT RULES

## Rule 1 — Inspect before modifying

Before changing anything, inspect:

- Complete Frontend structure
- Zustand stores
- Services
- Mock services
- TypeScript types/interfaces
- Existing API utilities
- Authentication state
- Routing/protected routes
- Editor state/persistence
- Backend controllers/routes/DTOs

Do not assume the architecture. Do not modify code during the initial audit.

## Rule 2 — Preserve the Frontend architecture

Keep:

```text
UI Components
      ↓
Zustand Stores
      ↓
Frontend Services
      ↓
HTTP Client
      ↓
ASP.NET Core API
```

Do not replace Zustand, rewrite the UI, put API calls directly in React components, or bypass the service layer.

## Rule 3 — Backend is the API source of truth

When a mismatch exists:

1. Verify the Backend endpoint.
2. Verify the Frontend expectation.
3. Prefer adapting the Frontend service/type boundary when the Backend contract is correct.
4. Change Backend only when genuinely necessary.

Do not redesign API contracts unnecessarily.

## Rule 4 — Do not rewrite working code

Do not introduce microservices, CQRS, GraphQL, Redux, or unnecessary caching/state libraries. Keep the existing modular full-stack architecture.

# 1. PHASE 13 OBJECTIVE

Transform:

```text
Next.js Frontend
      ↓
Mock Services
      ↓
Zustand
```

into:

```text
Next.js Frontend
      ↓
Zustand Stores
      ↓
Frontend Services
      ↓
HTTP Client
      ↓
ASP.NET Core REST API
      ↓
Application
      ↓
EF Core
      ↓
PostgreSQL
```

# 2. IMPLEMENTATION ORDER

Work incrementally:

```text
Phase 13.0 — Integration Audit
Phase 13.1 — HTTP Client
Phase 13.2 — Authentication
Phase 13.3 — Workspace
Phase 13.4 — Pages & Page Tree
Phase 13.5 — Editor & Auto-save
Phase 13.6 — Search / Favorites / Trash
Phase 13.7 — Comments & Sharing
Phase 13.8 — Notifications
Phase 13.9 — File Upload
Phase 13.10 — AI
Phase 13.11 — Error Handling & UX
Phase 13.12 — Full Integration Testing
Phase 13.13 — Cleanup & Documentation
```

Complete and validate each phase before moving forward.

# 3. PHASE 13.0 — INTEGRATION AUDIT

Create this mapping:

| Feature | Frontend Store | Frontend Service | Mock | Backend Endpoint | DTO | Status |
|---|---|---|---|---|---|---|
| Auth | | | | | | |
| Workspace | | | | | | |
| Pages | | | | | | |
| Editor | | | | | | |
| Search | | | | | | |
| Favorites | | | | | | |
| Trash | | | | | | |
| Comments | | | | | | |
| Sharing | | | | | | |
| Notifications | | | | | | |
| Files | | | | | | |
| AI | | | | | | |

Also compare:

- Property names/casing
- Nullable fields
- IDs
- Enums
- Dates
- Nested objects
- Pagination
- Error responses

Report mismatches and recommended adaptations.

**Do not modify code in Phase 13.0.**

At the end of Phase 13.0, stop and present the analysis.

# 4. PHASE 13.1 — HTTP CLIENT

Create/adapt a centralized HTTP client.

Preferred structure:

```text
src/services/
├── api/
│   ├── httpClient.ts
│   └── apiError.ts
├── authService.ts
├── workspaceService.ts
├── pageService.ts
├── searchService.ts
├── commentService.ts
├── notificationService.ts
├── fileService.ts
└── aiService.ts
```

Use existing native `fetch` if sufficient; otherwise use Axios if already installed or clearly justified.

Centralize:

- Base URL
- JSON headers
- Authorization
- Error parsing
- Response parsing

Use environment configuration such as:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Never hardcode environment-specific URLs.

# 5. PHASE 13.2 — AUTHENTICATION

Connect:

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/revoke-token
GET  /api/auth/me
```

Create/adapt `useAuthStore`.

Handle:

```text
Login
 ↓
Access Token
 ↓
Authenticated requests
 ↓
Access token expires
 ↓
Refresh Token
 ↓
New Access Token
 ↓
Retry request
```

Avoid infinite refresh loops.

If refresh fails:

```text
Clear auth state
Redirect to login
```

Do not expose backend/provider secrets to the browser.

Inspect the existing token-storage approach and use the safest practical strategy compatible with the current Backend contract. Do not blindly put long-lived sensitive credentials in localStorage.

# 6. PROTECTED ROUTES

Verify:

```text
Unauthenticated → Login
Authenticated → Workspace
Loading → Do not flash protected UI
Expired session → Refresh
Refresh failure → Logout
```

# 7. PHASE 13.3 — WORKSPACE

Connect:

```http
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/{id}
PUT    /api/workspaces/{id}
DELETE /api/workspaces/{id}
GET    /api/workspaces/{id}/members
POST   /api/workspaces/{id}/members
PUT    /api/workspaces/{id}/members/{userId}
DELETE /api/workspaces/{id}/members/{userId}
```

Replace workspace mocks while preserving existing Zustand APIs and UI behavior.

# 8. PHASE 13.4 — PAGES & PAGE TREE

Connect:

```http
GET   /api/workspaces/{workspaceId}/pages
GET   /api/workspaces/{workspaceId}/pages/tree
POST  /api/pages
GET   /api/pages/{id}
PUT   /api/pages/{id}
PATCH /api/pages/{id}/move
DELETE /api/pages/{id}
```

Replace `mockPageService`.

Verify:

- Create page
- Nested page
- Rename
- Delete
- Move/reorder
- Tree loading
- Breadcrumbs

Backend remains authoritative for hierarchy and permissions.

# 9. PHASE 13.5 — EDITOR

Connect:

```http
GET  /api/pages/{pageId}/content
PUT  /api/pages/{pageId}/content
POST /api/pages/{pageId}/blocks/batch
GET  /api/pages/{pageId}/history
POST /api/pages/{pageId}/history/{versionId}/restore
```

Maintain:

```text
Tiptap JSON
 ↓
Frontend Service
 ↓
ASP.NET Core
 ↓
PostgreSQL JSONB
```

Verify:

- Load
- Edit
- Save
- Auto-save
- Refresh persistence
- History if exposed

Do not send requests on every keystroke. Preserve or implement appropriate debouncing.

Handle:

```text
Saving
Saved
Save failed
Retry
```

# 10. PHASE 13.6 — SEARCH / FAVORITES / TRASH

Connect:

```http
GET  /api/workspaces/{workspaceId}/search?q={query}
GET  /api/workspaces/{workspaceId}/favorites
POST /api/pages/{id}/favorite
GET  /api/workspaces/{workspaceId}/trash
POST /api/pages/{id}/restore
DELETE /api/pages/{id}/permanent
```

Verify search, favorites, trash, restore, and permanent deletion.

# 11. PHASE 13.7 — COMMENTS & SHARING

Connect:

```http
GET    /api/pages/{pageId}/comments
POST   /api/pages/{pageId}/comments
PATCH  /api/comments/{id}/resolve
DELETE /api/comments/{id}
GET    /api/pages/{pageId}/permissions
POST   /api/pages/{pageId}/permissions
POST   /api/pages/{pageId}/share-link
```

Verify comments, replies, resolve, delete, permissions, and sharing.

Never treat Frontend role checks as security; Backend authorization remains authoritative.

# 12. PHASE 13.8 — NOTIFICATIONS

Connect:

```http
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/{id}/read
POST  /api/notifications/read-all
```

Preserve pagination. Do not introduce SignalR/WebSockets unless already required by the project.

# 13. PHASE 13.9 — FILES

Connect:

```http
POST /api/files/upload
GET  /api/files/{id}
```

Use `multipart/form-data`.

Handle:

- Uploading
- Success
- Failure
- Size errors
- Unsupported files
- Network failures

Do not bypass Backend validation.

# 14. PHASE 13.10 — AI

Connect:

```http
POST /api/ai/summarize
POST /api/ai/enhance
POST /api/ai/grammar
POST /api/ai/generate-blocks
```

Flow:

```text
Frontend
   ↓
aiService
   ↓
ASP.NET Core
   ↓
IAiService
   ↓
OpenAI / Ollama / Mock
```

Never expose provider API keys to the Frontend.

Handle loading, errors, rate limits, and timeouts.

# 15. PHASE 13.11 — ERROR HANDLING & UX

Handle:

```text
400
401
403
404
409
422
429
500
Network errors
```

Do not expose raw stack traces.

Provide consistent loading/error states.

Avoid blank screens and unhandled promise rejections.

# 16. TYPESCRIPT CONTRACT SAFETY

Do not use `any` to hide mismatches.

Explicitly handle:

- DTO property casing
- Nullable values
- Enums
- Dates
- IDs
- Nested objects
- Pagination
- Error responses

Verify Backend timestamps are handled consistently.

# 17. API REQUEST QUALITY

Inspect and eliminate unnecessary duplicate requests caused by:

- Incorrect useEffect dependencies
- Component remounts
- Duplicate store initialization

Do not add a large caching library without demonstrated need.

Use optimistic updates only where useful and implement rollback on failure.

# 18. SECURITY INTEGRATION TESTING

Create/use two users:

```text
User A
User B
```

Verify User A cannot access User B's:

- Workspace
- Page
- Editor content
- Comments
- Files
- Notifications
- Favorites
- AI context

Test resource-ID manipulation such as:

```text
GET User B page
PUT User B page
DELETE User B page
GET User B file
POST comment on User B page
Modify User B permission
```

Expected result should match Backend security behavior, normally 403 or 404.

Also verify:

- Expired access tokens
- Refresh failure
- Authorization
- CORS
- Secret exposure

# 19. BUILD & TEST

After integration, run the applicable checks:

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

Backend:

```bash
dotnet build
dotnet test
```

Do not claim success unless the commands actually pass.

Do not perform destructive database operations.

# 20. FULL-STACK FLOW TESTING

Verify:

## Authentication

```text
Register → Login → Me → Authenticated API → Refresh → Revoke
```

## Workspace

```text
Create → Load → Members
```

## Pages

```text
Create → Nested → Open → Rename → Move → Delete → Trash → Restore
```

## Editor

```text
Open → Load Content → Edit → Auto-save → Refresh → Content persists
```

## Search

```text
Create page → Add content → Search → Find page
```

## Sharing

```text
Share → Other user → Open → Permission enforced
```

## Files

```text
Upload → Persist → Retrieve
```

## AI

```text
Select content → AI request → Backend → AI service → Result
```

# 21. CLEANUP

After real API integration is verified, inspect for:

```text
mock
mockService
dummy
fake
temporary
TODO
FIXME
hardcoded API URL
console.log
any
unused imports
dead services
```

Remove obsolete mocks only after confirming nothing still depends on them.

Do not remove useful mocks used by isolated UI tests without a reason.

# 22. DEFINITION OF DONE

Phase 13 is complete only when:

### Authentication
- Register works
- Login works
- JWT is used
- Refresh works
- Revoke/logout works
- Protected routes work

### Workspace
- Real API is used
- CRUD works
- Members work

### Pages
- Real API is used
- Nested pages work
- Rename works
- Move/reorder works
- Delete works

### Editor
- Content loads
- Content saves
- Auto-save works
- Refresh preserves content
- History works if exposed

### Search/Favorites/Trash
- Search uses Backend
- Favorites use Backend
- Trash uses Backend
- Restore works
- Permanent delete works

### Comments/Sharing
- Comments work
- Replies work
- Resolve works
- Sharing works
- Permissions are enforced

### Notifications
- List works
- Unread count works
- Read actions work

### Files
- Upload works
- Retrieval works
- Validation errors are handled

### AI
- Summarize works
- Enhance works
- Grammar works
- Block generation works
- Provider API keys are never exposed

### Security
- Cross-user access is rejected
- Expired tokens are handled
- Refresh failure logs out
- No secrets are committed
- CORS remains secure

### Quality
- No accidental mock API calls remain
- No hardcoded API URLs remain
- No unnecessary `any`
- No debug logging remains
- Frontend build passes
- Frontend lint passes
- Backend build passes
- Backend tests pass

# 23. FINAL REPORT

Produce:

## A. Integration Summary

```text
Authentication:
Workspace:
Pages:
Editor:
Search:
Favorites:
Trash:
Comments:
Sharing:
Notifications:
Files:
AI:
```

Use:

```text
Complete
Needs Fix
Blocked
```

## B. API Integration Map

| Feature | Service | Endpoint | Store | Status |
|---|---|---|---|---|
| Auth | | | | |
| Workspace | | | | |
| Pages | | | | |
| Editor | | | | |
| Search | | | | |
| Favorites | | | | |
| Trash | | | | |
| Comments | | | | |
| Sharing | | | | |
| Notifications | | | | |
| Files | | | | |
| AI | | | | |

## C. Issues Found

Classify:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

For each:

```text
Problem
Affected files
Root cause
Recommended fix
```

## D. Remaining Mock/Temporary Code

List every remaining mock, dummy, fake, temporary implementation, hardcoded URL, or debugging statement and explain whether it should remain.

## E. Security Verification

Report:

```text
Cross-user access
Token expiration
Refresh flow
Authorization
File access
AI authorization
CORS
Secret exposure
```

## F. Final Status

Use exactly one:

```text
READY FOR FULL-STACK DEVELOPMENT
```

or:

```text
NEEDS FIXES BEFORE FULL-STACK DEVELOPMENT
```

Do not claim READY unless actual verification supports it.

# 24. EXECUTION RULE

Do not make uncontrolled bulk changes.

Work phase by phase.

After each phase:

1. Build/check affected Frontend code.
2. Check TypeScript errors.
3. Verify relevant Backend API behavior.
4. Run relevant tests.
5. Summarize changes.
6. Continue only when stable.

If a major mismatch is discovered, STOP and report it instead of inventing a workaround.

# START

Start with **PHASE 13.0 — FRONTEND/BACKEND INTEGRATION AUDIT**.

Inspect the existing Frontend and Backend.

Do NOT modify code yet.

Produce:

1. Current Frontend architecture
2. Current Backend architecture
3. Store/service mapping
4. Mock-to-real API mapping
5. API contract comparison
6. Authentication integration plan
7. Potential mismatches
8. Risks
9. Recommended implementation order

Then stop and wait for approval before implementing Phase 13.1.
