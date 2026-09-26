# Notion Clone — ASP.NET Core Backend Implementation Master Prompt

You are a **Senior Backend Engineer and Software Architect**.

I have already implemented the Frontend of a Notion Clone.

The goal is to build a production-oriented ASP.NET Core Web API backend that integrates cleanly with the existing Frontend.

## Technology Stack

- ASP.NET Core Web API
- C#
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- RESTful API
- Swagger / OpenAPI
- FluentValidation where appropriate
- Dependency Injection
- Docker
- Automated testing

AI features will be implemented in a later phase.

---

# IMPORTANT DEVELOPMENT RULES

## Rule 1 — Work Phase by Phase

Do NOT implement the entire backend at once.

The project is divided into:

```text
Phase 0  — Analyze Existing Frontend
Phase 1  — Backend Foundation
Phase 2  — Database & EF Core
Phase 3  — Authentication & Authorization
Phase 4  — Workspace Management
Phase 5  — Page & Page Tree Management
Phase 6  — Editor Persistence
Phase 7  — Search, Favorites & Trash
Phase 8  — Comments & Sharing
Phase 9  — Notifications
Phase 10 — File & Media Management
Phase 11 — AI Integration
Phase 12 — Testing, Security, Performance & Docker
```

Complete and validate each phase before moving to the next phase.

Do not implement future phases unless explicitly instructed.

---

# Rule 2 — Inspect Before Coding

Before implementing any phase:

1. Inspect the existing repository.
2. Inspect the current backend structure, if one exists.
3. Inspect the existing Frontend.
4. Inspect Frontend types.
5. Inspect Frontend services.
6. Inspect mock services.
7. Inspect API expectations.
8. Identify existing conventions.
9. Identify conflicts.
10. Explain the implementation plan for the current phase.

Do not blindly create files.

---

# Rule 3 — Preserve Existing Frontend Contracts

The Backend should adapt to the existing Frontend wherever reasonable.

Do not unnecessarily force the Frontend to change.

If a Frontend type or service expects:

```text
User
Workspace
Page
Comment
Notification
```

provide compatible API contracts.

If a mismatch is unavoidable:

1. Explain the mismatch.
2. Explain why it exists.
3. Propose the smallest reasonable Frontend change.
4. Do not modify the Frontend unless explicitly instructed.

---

# Rule 4 — Do Not Overengineer

This is a portfolio project intended to demonstrate strong engineering skills.

Use clean architecture principles, but avoid unnecessary enterprise complexity.

Do NOT introduce unnecessary:

- Microservices
- CQRS frameworks
- Event sourcing
- Message brokers
- Kubernetes
- Distributed systems

Prefer a well-structured modular monolith.

---

# Rule 5 — No Hardcoded Secrets

Never hardcode:

- JWT secrets
- Database passwords
- API keys
- AI provider keys
- Connection credentials

Use configuration and environment variables appropriately.

Never commit secrets.

---

# Rule 6 — Validate Every Phase

After each phase:

1. Build the backend.
2. Run tests.
3. Run database migrations if applicable.
4. Run the API.
5. Verify Swagger.
6. Verify implemented endpoints.
7. Check compiler warnings.
8. Check obvious runtime errors.
9. Summarize what was implemented.

Only then proceed to the next phase.

---

# Rule 7 — Do Not Break Existing Work

Before changing an existing file:

- Inspect it.
- Understand its purpose.
- Preserve working behavior.
- Make the smallest necessary change.

---

# PHASE 0 — ANALYZE EXISTING FRONTEND

## Goal

Understand the existing Frontend before designing the Backend.

Do NOT write Backend implementation code yet.

Analyze:

```text
Frontend
├── Routes
├── Components
├── Stores
├── Hooks
├── Services
├── Types
├── Mock Services
├── Editor
├── Authentication
├── Search
├── Comments
├── Sharing
├── Notifications
└── AI
```

Pay special attention to:

```text
pageService
workspaceService
authService
commentService
searchService
notificationService
AI service
```

Identify:

- Request-like methods
- Expected parameters
- Return types
- Entity structures
- Relationships
- Error expectations
- Loading states
- Persistence requirements

### Phase 0 Output

Create a Backend Integration Specification containing:

```text
1. Frontend entities
2. Backend entities
3. Entity relationships
4. Required API endpoints
5. Request DTO candidates
6. Response DTO candidates
7. Authentication requirements
8. Authorization requirements
9. Persistence requirements
10. Frontend/backend mismatches
```

Do not modify code.

---

# PHASE 1 — BACKEND FOUNDATION

## Goal

Create the ASP.NET Core backend foundation.

Recommended structure:

```text
backend/
│
├── src/
│   ├── NotionClone.Api/
│   ├── NotionClone.Application/
│   ├── NotionClone.Domain/
│   └── NotionClone.Infrastructure/
│
├── tests/
│   ├── NotionClone.UnitTests/
│   └── NotionClone.IntegrationTests/
│
├── docker/
└── README.md
```

Use a modular monolith.

### Domain

Contains:

- Entities
- Enums
- Value objects where necessary
- Domain rules

### Application

Contains:

- DTOs
- Interfaces
- Business logic
- Service abstractions
- Validation

### Infrastructure

Contains:

- EF Core
- PostgreSQL
- Authentication infrastructure
- External services
- File storage
- AI provider integration later

### API

Contains:

- Controllers
- Middleware
- Authentication configuration
- Dependency injection
- Swagger configuration

Do not implement business features yet.

### Validation

Run:

```bash
dotnet build
dotnet test
dotnet run
```

Verify Swagger works.

---

# PHASE 2 — DATABASE & EF CORE

## Goal

Create the PostgreSQL database architecture.

Use:

```text
PostgreSQL
Entity Framework Core
Code First
```

Potential entities:

```text
User
Workspace
WorkspaceMember
Page
PageVersion
Comment
Notification
Favorite
Share
File
AIConversation
AIMessage
```

Do not automatically create every entity if Phase 0 shows it is unnecessary.

## Entity Relationships

Expected conceptual structure:

```text
User
 │
 ├── WorkspaceMember
 │          │
 │          └── Workspace
 │                 │
 │                 └── Page
 │                       │
 │                       ├── Child Page
 │                       ├── PageVersion
 │                       ├── Comment
 │                       └── Share
 │
 └── Notification
```

Page hierarchy:

```text
Workspace
    │
    └── Page
         │
         ├── Page
         │    ├── Page
         │    └── Page
         │
         └── Page
```

Use `ParentId` for nested pages.

Database requirements:

- Primary keys
- Foreign keys
- Indexes
- Unique constraints
- Nullable fields
- Cascade/restrict behavior
- CreatedAt
- UpdatedAt
- Soft-delete fields where appropriate
- Appropriate PostgreSQL types

For editor content, use a structure compatible with Tiptap JSON. PostgreSQL JSONB is preferred when appropriate.

Create and validate EF Core migrations.

---

# PHASE 3 — AUTHENTICATION & AUTHORIZATION

Implement:

```text
Register
Login
Refresh Token
Logout
Current User
Authorization
```

Endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

Use:

- JWT Access Token
- Refresh Token
- Password Hashing
- ASP.NET Core Authentication
- ASP.NET Core Authorization

Never store plain-text passwords.

Roles:

```text
Owner
Admin
Editor
Viewer
```

Backend authorization must enforce workspace/page permissions. Do not rely on Frontend permission checks.

---

# PHASE 4 — WORKSPACE MANAGEMENT

Endpoints:

```text
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/{id}
PATCH  /api/workspaces/{id}
DELETE /api/workspaces/{id}
```

Members:

```text
GET    /api/workspaces/{id}/members
POST   /api/workspaces/{id}/members
PATCH  /api/workspaces/{id}/members/{memberId}
DELETE /api/workspaces/{id}/members/{memberId}
```

Implement workspace CRUD, member management, roles, and authorization.

Only authorized workspace members can access workspace data.

---

# PHASE 5 — PAGE & PAGE TREE MANAGEMENT

Implement:

```text
GET    /api/workspaces/{workspaceId}/pages
POST   /api/workspaces/{workspaceId}/pages
GET    /api/pages/{id}
PATCH  /api/pages/{id}
DELETE /api/pages/{id}
GET    /api/workspaces/{workspaceId}/pages/tree
GET    /api/pages/{id}/children
POST   /api/pages/{id}/children
```

Support:

- Create page
- Create child page
- Rename
- Update
- Delete
- Move
- Nested pages
- Archive
- Restore
- Icon
- Cover
- Parent/child relationship

Page move:

```text
PATCH /api/pages/{id}/move
```

Request:

```json
{
  "parentId": "..."
}
```

Prevent:

- Cross-workspace parent relationships
- Self-parenting
- Circular hierarchies

---

# PHASE 6 — EDITOR PERSISTENCE

Connect Tiptap editor data with the Backend.

Preferred representation:

```text
Tiptap JSON
```

Endpoints:

```text
GET /api/pages/{id}/content
PUT /api/pages/{id}/content
```

Support:

- Save content
- Retrieve content
- UpdatedAt
- Versioning if required
- Safe repeated auto-save

Consider concurrency and optimistic concurrency only where justified.

---

# PHASE 7 — SEARCH, FAVORITES & TRASH

## Search

```text
GET /api/search?q={query}&workspaceId={workspaceId}
```

Initially support:

- Page title
- Page content if practical
- Workspace scope
- Access restrictions

Prefer PostgreSQL search capabilities initially. Do not add Elasticsearch without justification.

## Favorites

```text
GET    /api/favorites
POST   /api/pages/{id}/favorite
DELETE /api/pages/{id}/favorite
```

Prevent duplicate favorites.

## Trash

```text
DELETE /api/pages/{id}
GET    /api/trash
POST   /api/pages/{id}/restore
DELETE /api/pages/{id}/permanent
```

Prefer soft delete for normal deletion.

---

# PHASE 8 — COMMENTS & SHARING

## Comments

```text
GET    /api/pages/{pageId}/comments
POST   /api/pages/{pageId}/comments
PATCH  /api/comments/{id}
DELETE /api/comments/{id}
```

Support author, content, timestamps, page relationship, and permissions.

## Sharing

Potential endpoints:

```text
GET    /api/pages/{pageId}/shares
POST   /api/pages/{pageId}/shares
PATCH  /api/shares/{id}
DELETE /api/shares/{id}
```

Support Viewer and Editor access.

Do not expose private pages without authorization.

---

# PHASE 9 — NOTIFICATIONS

Potential events:

```text
Comment
Workspace invitation
Page sharing
Mention
Permission changes
```

Endpoints:

```text
GET   /api/notifications
PATCH /api/notifications/{id}/read
POST  /api/notifications/read-all
```

Add pagination where appropriate.

Do not implement realtime notifications unless required by the Frontend.

---

# PHASE 10 — FILE & MEDIA MANAGEMENT

Support files used by the Notion editor:

```text
Images
Attachments
Documents
```

Create:

```text
IFileStorage
```

Initial implementation may use:

```text
LocalFileStorage
```

Later providers may include:

```text
Azure Blob Storage
S3
Cloudinary
```

API:

```text
POST   /api/files
GET    /api/files/{id}
DELETE /api/files/{id}
```

Validate file size, MIME type, authorization, ownership, and safe filenames.

---

# PHASE 11 — AI INTEGRATION

Implement AI only after the core application works.

Potential features:

```text
Summarize
Rewrite
Improve writing
Continue writing
Translate
Explain
Generate content
Ask about page
AI chat
```

Architecture:

```text
Frontend
   │
   ▼
ASP.NET Core API
   │
   ▼
AI Service Abstraction
   │
   ▼
AI Provider
```

Create an abstraction such as:

```text
IAiService
```

Potential endpoints:

```text
POST /api/ai/chat
POST /api/ai/summarize
POST /api/ai/rewrite
POST /api/ai/generate
```

Choose only the endpoints required by the actual Frontend.

Never expose AI provider API keys to the Frontend.

---

# PHASE 12 — TESTING, SECURITY, PERFORMANCE & DOCKER

Implement:

### Unit Tests

- Business rules
- Services
- Validators
- Permission logic

### Integration Tests

- Authentication
- Workspace APIs
- Page APIs
- Database interaction
- Authorization

Verify:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Use `ProblemDetails` for consistent errors.

Review:

- Password hashing
- JWT configuration
- Refresh tokens
- Authorization
- Input validation
- EF Core query safety
- XSS-related content handling
- File upload validation
- CORS
- Rate limiting where appropriate
- Secrets management

Review performance:

- Database indexes
- EF Core queries
- N+1 queries
- Pagination
- Search
- Page tree queries
- Large editor content
- File uploads

Create:

```text
Dockerfile
docker-compose.yml
```

Support:

```text
ASP.NET Core API
PostgreSQL
```

Do not add Redis unless clearly justified.

---

# API DESIGN PRINCIPLES

Follow RESTful conventions.

Use:

```text
GET
POST
PUT
PATCH
DELETE
```

Use appropriate status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Do not return EF Core entities directly from controllers.

Use DTOs.

Separate:

```text
Entity
DTO
Request DTO
Response DTO
```

Example:

```text
Page
PageResponseDto
CreatePageRequest
UpdatePageRequest
MovePageRequest
```

---

# VALIDATION & ERROR HANDLING

Validate:

- Required fields
- String lengths
- IDs
- Permissions
- Relationships
- Workspace membership
- Page ownership
- File constraints

Use FluentValidation if it improves consistency.

Create centralized error handling and prefer `ProblemDetails`.

Never expose stack traces in production responses.

---

# LOGGING

Use structured logging.

Log useful:

- Authentication failures
- Business events
- Exceptions
- External API failures
- Database failures

Never log:

- Passwords
- JWT secrets
- API keys
- Sensitive personal data unnecessarily

---

# CODE QUALITY

Follow:

- SOLID principles
- Dependency Injection
- Async/await
- CancellationToken where appropriate
- Nullable reference types
- Clear naming
- Small focused services
- Consistent error handling
- Consistent API responses

Avoid:

- Giant controllers
- Business logic inside controllers
- Static global state
- Hardcoded configuration
- Duplicate logic
- Over-abstraction

---

# PROJECT STRUCTURE

Prefer:

```text
backend/
│
├── src/
│   ├── NotionClone.Api/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Extensions/
│   │   └── Program.cs
│   │
│   ├── NotionClone.Application/
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   ├── Services/
│   │   ├── Validators/
│   │   └── Common/
│   │
│   ├── NotionClone.Domain/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   └── Common/
│   │
│   └── NotionClone.Infrastructure/
│       ├── Persistence/
│       ├── Authentication/
│       ├── Storage/
│       ├── AI/
│       └── Services/
│
├── tests/
│   ├── NotionClone.UnitTests/
│   └── NotionClone.IntegrationTests/
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

Adjust this structure if the repository already has a reasonable architecture. Do not restructure unnecessarily.

---

# FRONTEND INTEGRATION STRATEGY

The current Frontend is expected to follow:

```text
Component
    ↓
Zustand Store
    ↓
Service
    ↓
Mock Service
```

The target architecture is:

```text
Component
    ↓
Zustand Store
    ↓
Service
    ↓
HTTP Client
    ↓
ASP.NET Core API
    ↓
Application
    ↓
Infrastructure
    ↓
EF Core
    ↓
PostgreSQL
```

The Frontend service layer should remain the boundary between UI and API.

Do not put raw `fetch` calls throughout React components.

Use an environment variable such as:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Do not hardcode production URLs.

Configure CORS using explicit Frontend origins.

---

# DEVELOPMENT WORKFLOW

For every phase:

## Step 1
Inspect existing code.

## Step 2
Explain the implementation plan.

## Step 3
Implement only the current phase.

## Step 4
Build.

## Step 5
Run tests.

## Step 6
Run migrations if required.

## Step 7
Run the API.

## Step 8
Verify Swagger/endpoints.

## Step 9
Review changed files.

## Step 10
Report:

```text
Implemented:
Files Added:
Files Modified:
Database Changes:
Endpoints Added:
Tests Added:
Validation Results:
Known Issues:
Next Phase:
```

---

# PHASE COMPLETION RULE

Do NOT automatically continue to the next phase.

After completing each phase, stop and provide the phase report.

Wait for explicit confirmation before implementing the next phase.

---

# FINAL BACKEND GOAL

The finished architecture should be:

```text
                         ┌──────────────────┐
                         │    Next.js FE    │
                         │ React + TS       │
                         └────────┬─────────┘
                                  │
                                  │ REST API
                                  ▼
                         ┌──────────────────┐
                         │ ASP.NET Core API │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              Application      Domain    Infrastructure
                    │                           │
                    │                           ▼
                    │                       EF Core
                    │                           │
                    │                           ▼
                    │                      PostgreSQL
                    │
                    ├── Authentication
                    ├── Workspace
                    ├── Pages
                    ├── Editor
                    ├── Search
                    ├── Comments
                    ├── Sharing
                    ├── Notifications
                    ├── Files
                    └── AI
```

---

# FINAL SUCCESS CRITERIA

The backend is considered complete when:

- Frontend can authenticate users
- Users can access authorized workspaces
- Users can create/update/delete pages
- Nested pages work
- Page hierarchy persists
- Editor content persists
- Search works
- Favorites work
- Trash works
- Comments work
- Sharing and permissions work
- Notifications work
- Files can be uploaded safely
- AI features work through the Backend
- API documentation works
- Unit tests exist
- Integration tests exist
- Database migrations work
- Docker environment works
- Secrets are not committed
- Backend authorization is enforced
- Frontend can consume the API without architectural rewrites

---

# STARTING INSTRUCTION

Before writing any code:

1. Inspect the existing repository.
2. Analyze the Frontend architecture.
3. Identify existing services, stores, types, and mock APIs.
4. Determine required Backend contracts.
5. Produce the Phase 0 analysis.
6. Do NOT implement Phase 1 yet.

After Phase 0 is reviewed and approved, proceed to Phase 1.

**Do not skip phases.**

**Do not implement future phases early.**

**Do not modify the Frontend unless explicitly instructed.**
