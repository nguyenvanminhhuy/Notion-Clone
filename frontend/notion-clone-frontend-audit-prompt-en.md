# Notion Clone — Frontend Architecture & Backend Readiness Audit

You are a **Senior Frontend Architect and Code Reviewer**.

I have already implemented the Frontend of a Notion Clone based on a previous frontend specification.

The Frontend is intended to become a real full-stack application later, with an ASP.NET Core backend and PostgreSQL database.

Your task is to **ANALYZE AND AUDIT THE EXISTING FRONTEND CODEBASE ONLY**.

## IMPORTANT RULES

### DO NOT modify any code.

Do NOT:
- Create, delete, or rename files
- Refactor code
- Install or update dependencies
- Change configuration or UI
- Fix bugs
- Generate implementation code

This task is **ANALYSIS ONLY**. Do not make any changes to the repository.

---

# 1. Understand the Existing Project

Inspect the entire project structure and analyze:

- `package.json`
- `src/`
- `app/`
- `components/`
- `features/`
- `hooks/`
- `stores/`
- `lib/`
- `services/`
- `mock/`
- `types/`
- `utils/`
- Configuration and environment files
- Tiptap configuration
- Zustand stores
- TanStack Query configuration
- Authentication
- Routing
- API/mock service layer

Analyze the **actual implementation**, not the intended architecture.

---

# 2. Executive Summary

Start with:

```text
Project Status:
Architecture Status:
Backend Readiness:
Code Quality:
Technical Debt:
Overall Assessment:
```

Give a short explanation for each.

Do not give numerical scores or rankings. Be objective and evidence-based.

---

# 3. Current Architecture

Describe the architecture that actually exists.

Use a structure similar to:

```text
Frontend
├── Routing
├── Layout
├── UI Components
├── Feature Modules
├── State Management
├── Services
├── Mock Data
├── Editor
├── Authentication
└── Utilities
```

For each area explain:
- What exists
- Where it is located
- Its responsibility
- Whether the responsibility is appropriate
- Architectural concerns

---

# 4. Component Architecture

Analyze the component hierarchy.

Identify shared components such as:

```text
Button
Dialog
Modal
Dropdown
Input
Tooltip
Avatar
Toast
```

And feature components such as:

```text
Sidebar
PageTree
Editor
Search
AI Assistant
Comments
Sharing
Notifications
```

For important components determine:
- Responsibility
- Approximate complexity
- Reusability
- Whether responsibilities are excessive
- Whether business logic is mixed with UI
- Whether it may become problematic during backend integration

Do not refactor anything.

---

# 5. State Management Audit

Analyze all Zustand stores and other state mechanisms.

Create:

| Store / State | Location | Purpose | Data Type | Used By | Concern |
|---|---|---|---|---|---|

Identify:
- Global state
- Local state
- Derived state
- UI state
- Server-like state
- Persistent state

Pay special attention to:
- Workspace
- Page
- Page tree
- Editor
- Authentication
- Search
- AI
- Notifications
- Sidebar
- Theme

Determine whether server data and UI state are properly separated.

---

# 6. Mock Service Architecture

Find every mock service, for example:

```text
mockPageService
mockWorkspaceService
mockAuthService
mockSearchService
mockCommentService
mockAIService
mockNotificationService
```

For each analyze:
- Methods
- Input types
- Output types
- Promise usage
- Error handling
- Loading simulation
- Data persistence
- Relationship with components
- Whether it can later be replaced by a real API

Create:

| Service | Methods | Interface Quality | Backend Ready? | Problems |
|---|---|---|---|---|

Do not modify services.

---

# 7. Identify Direct Mock Data Access

Search for components that directly access mock data, arrays, objects, `localStorage`, or `sessionStorage` without going through a service, hook, or store.

Report:

```text
File:
Location:
What it accesses:
Why it may become a problem:
Recommended future boundary:
```

Do not fix it.

---

# 8. Data Model Audit

Analyze all TypeScript interfaces/types.

Pay special attention to:

```text
User
Workspace
WorkspaceMember
Page
PageNode
PageVersion
Comment
Notification
Favorite
File
Share
Permission
Role
AIConversation
AIMessage
```

Look for:
- Missing IDs
- Missing foreign keys
- Incorrect relationships
- Client-only fields
- Backend-required fields
- Ambiguous types
- Inconsistent naming
- Date handling
- Optional/nullable fields
- Nested structures
- Fields that should not be persisted

Create:

| Entity | Current Fields | Backend Concerns | Recommendation |
|---|---|---|---|

Do not redesign models yet.

---

# 9. Page Tree Analysis

Analyze:

```text
parentId
children
nested pages
recursive rendering
create child page
rename
delete
move
drag & drop
favorite
archive
```

Determine:
- How hierarchy is represented
- Whether it is normalized
- Whether it can scale
- Whether moving a page is handled cleanly
- Potential recursive rendering performance issues
- Whether it maps cleanly to PostgreSQL

Pay special attention to:

```text
Page
parentId
workspaceId
```

Explain what the backend will need to support the current frontend behavior.

---

# 10. Rich Text Editor Audit

Analyze the Tiptap implementation.

Check:
- Extensions
- Editor initialization
- Document schema
- JSON/HTML/Markdown content
- Auto-save
- Debouncing
- Undo/redo
- Slash commands
- Bubble menu
- Floating toolbar
- Images
- Tables
- Links
- Code blocks
- Task lists
- Mentions
- AI integration points

Determine:
- What should be persisted
- What should remain client-only
- What format should eventually be stored in PostgreSQL

---

# 11. Authentication Audit

Analyze the current authentication implementation.

Determine whether it uses:

```text
Mock only
Local state
Context
Zustand
Cookies
localStorage
Session storage
```

Identify all authentication logic and explain what will need to change when moving to:

```text
ASP.NET Core
+
JWT
+
Refresh Token
```

Do not implement authentication.

---

# 12. Routing Audit

Analyze all routes.

Create:

| Route | Purpose | Auth Required? | Data Required | Backend Dependency |
|---|---|---|---|---|

Identify public, protected, dynamic, workspace, page, settings, and auth routes.

Explain whether the routing structure is suitable for backend integration.

---

# 13. API Readiness

Analyze the frontend as if a backend were going to be connected tomorrow.

Identify every backend-dependent feature:

```text
Authentication
Workspace
Pages
Page tree
Search
Comments
Notifications
Sharing
Files
AI
```

Create:

| Feature | Current Data Source | Future API Needed | Current Boundary |
|---|---|---|---|

Do not create API calls.

---

# 14. API Contract Candidates

Based on the existing frontend, propose a **candidate API contract** only.

Example:

```text
GET    /api/workspaces
POST   /api/workspaces

GET    /api/workspaces/{id}/pages
POST   /api/workspaces/{id}/pages

GET    /api/pages/{id}
PATCH  /api/pages/{id}
DELETE /api/pages/{id}
```

For each endpoint explain:
- Why it is needed
- Request data
- Response data
- Authentication requirement
- Related frontend feature

This is a proposal, not implementation.

---

# 15. Backend Data Requirements

Infer likely backend entities from the actual frontend:

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

For each explain:
- Why it exists
- Which frontend feature uses it
- Important relationships
- Potential foreign keys

Do not create an ERD unless one already exists.

---

# 16. Persistence Audit

Identify data that disappears after browser refresh.

Examples:

```text
Pages
Workspace
Favorites
Comments
Notifications
Editor content
Authentication
Theme
Recent pages
```

Create:

| Data | Current Persistence | Should Persist in Backend? |
|---|---|---|

Separate:
- Client-only state
- Server state
- User preferences

---

# 17. Error Handling Audit

Analyze:
- API-like errors
- Mock errors
- Toasts
- Error boundaries
- Form errors
- Editor errors
- Loading states
- Empty states

Determine whether the architecture can handle real HTTP errors:

```text
400
401
403
404
409
422
429
500
```

Do not implement error handling.

---

# 18. Loading & Async State Audit

Find all asynchronous operations.

Analyze:
- Loading
- Error
- Success
- Retry
- Optimistic updates
- Rollback
- Race conditions

Pay special attention to:
- Page creation
- Page deletion
- Page updates
- Auto-save
- Search
- AI generation
- Comments
- Notifications

Only identify issues.

---

# 19. Performance Audit

Analyze potential performance issues.

Focus on:

### Page Tree
Could there be hundreds or thousands of pages?

### Editor
Could editing trigger unnecessary global re-renders?

### Search
Is search debounced?

### Sidebar
Does every state change cause the entire sidebar to render?

### Zustand
Are selectors used correctly?

### Lists
Would virtualization eventually be necessary?

Do not optimize the code.

---

# 20. Security Readiness

Check for:
- Sensitive data in localStorage
- Tokens
- User-controlled HTML
- XSS risks
- Unsafe rendering
- Environment variables
- Client-side secrets
- Permission checks
- Sharing logic

Clearly distinguish:

```text
Frontend UX permission
```

from:

```text
Backend authorization
```

Do not assume frontend permission checks are sufficient.

---

# 21. AI Architecture Audit

Analyze:
- AI state
- AI messages
- Mock AI responses
- Streaming simulation
- Selected text context
- Page context
- Future ASP.NET Core AI endpoint compatibility

Potential future architecture:

```text
React
 ↓
AI Service
 ↓
ASP.NET Core
 ↓
AI Provider
```

Explain what the current frontend supports and what is missing.

---

# 22. Environment & Configuration Audit

Inspect:

```text
.env
.env.local
.env.example
next.config.*
tsconfig.json
eslint config
tailwind config
package.json
```

Determine:
- Values that should eventually be environment variables
- Hard-coded values
- Client-safe configuration
- Server-only configuration

Do not modify configuration.

---

# 23. Dependency Audit

Analyze dependencies and group them into:

```text
Core
UI
Editor
State
Forms
Animation
Testing
Utilities
```

Identify:
- Necessary dependencies
- Potentially redundant dependencies
- Dependencies affecting backend integration
- Currently unused dependencies

Do not uninstall anything.

---

# 24. Technical Debt

Categorize technical debt:

```text
Architecture
State Management
TypeScript
UI
Performance
Data Modeling
Mock Services
Authentication
Editor
Testing
Accessibility
```

For each issue explain:

```text
Problem
Impact
Why it matters
When it should be fixed
```

Do not fix anything.

---

# 25. Backend Migration Plan

Based strictly on the actual frontend, propose the order in which mock services should eventually be replaced.

Example:

```text
1. Authentication
2. Workspace
3. Pages
4. Editor persistence
5. Favorites
6. Search
7. Comments
8. Sharing
9. Notifications
10. Files
11. AI
```

Explain dependencies between them.

---

# 26. Frontend → Backend Boundary

Define a clear boundary between frontend and backend responsibilities.

Example:

```text
Frontend
├── Rendering
├── Local UI state
├── Form UX
├── Optimistic updates
├── Editor interaction
└── Client validation

Backend
├── Authentication
├── Authorization
├── Persistence
├── Business rules
├── Validation
├── Search
├── File storage
└── AI orchestration
```

Adjust this based on the actual codebase.

---

# 27. Critical Findings

At the end, provide:

## Critical
Issues that should be addressed before backend integration.

## Important
Issues that should be addressed during backend integration.

## Nice to Have
Issues that can wait.

Do not assign numerical scores.

---

# 28. Final Report

Your final response must contain:

```text
# 1. Executive Summary
# 2. Current Architecture
# 3. Component Architecture
# 4. State Management
# 5. Mock Services
# 6. Data Models
# 7. Page Tree
# 8. Rich Text Editor
# 9. Authentication
# 10. Routing
# 11. API Readiness
# 12. Candidate API Contract
# 13. Backend Data Requirements
# 14. Persistence
# 15. Error Handling
# 16. Async State
# 17. Performance
# 18. Security
# 19. AI Architecture
# 20. Environment & Configuration
# 21. Dependencies
# 22. Technical Debt
# 23. Backend Migration Plan
# 24. Frontend/Backend Boundary
# 25. Critical Findings
# 26. Recommended Next Step
```

---

# 29. Most Important Rule

**Do not modify the codebase.**

I want an **architectural audit and technical analysis only**.

Use the actual code as evidence.

When making a claim, reference the relevant:

```text
file
component
hook
store
service
type
```

Do not invent architecture that does not exist.

At the end, answer this specific question:

> **"Is the current Frontend architecture ready to begin ASP.NET Core Backend integration? If not, exactly what should be fixed first?"**

Do not make the fixes.

Only explain them.
