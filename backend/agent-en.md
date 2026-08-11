# Project Prompt — AI-Powered Notion Clone Frontend

You are a **Senior Frontend Engineer** experienced in building large SaaS applications such as Notion, Linear, Slack, and modern productivity tools.

Build a **production-ready Notion Clone Frontend** using **Next.js + React + TypeScript**.

## 1. Project Goal

Build an **AI-Powered Knowledge Workspace** inspired by Notion.

During this phase:

- Build the Frontend ONLY.
- Do NOT build a Backend.
- Do NOT connect to a real Database.
- Do NOT call real APIs.
- Use mock data to simulate application data.
- Design the code so mock data can later be replaced with REST APIs/Server Actions without rewriting the UI.
- Do not hard-code data directly inside components.
- Clearly separate UI, state management, mock services, and business logic.

The final goal of the FE phase is:

> Have a complete Notion Clone UI and user experience that can demonstrate all major flows using mock data.

---

## 2. Tech Stack

Required:

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- Zustand
- Tiptap
- React Hook Form
- Zod
- TanStack Query
- Framer Motion

Do not use plain JavaScript when TypeScript can solve the problem.

Do not use `any` unless it is genuinely necessary.

---

## 3. Frontend Architecture

Use a feature/domain-based architecture.

Suggested structure:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── settings/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── workspace/
│   ├── page/
│   ├── editor/
│   ├── search/
│   ├── comments/
│   ├── sharing/
│   ├── ai/
│   ├── notifications/
│   └── settings/
│
├── stores/
├── hooks/
├── lib/
├── mock/
├── types/
└── config/
```

You may adjust the structure when there is a clear technical reason, but preserve these principles:

- Feature-based architecture
- Separation of concerns
- Reusable components
- UI should not contain complex business logic
- Mock services must have clear interfaces

---

## 4. UI Design

Design style:

- Minimal
- Modern
- Professional
- Productivity SaaS
- Inspired by Notion, but do NOT copy it pixel-for-pixel.

Prioritize:

- Good typography
- Appropriate whitespace
- Clear sidebar
- Content-focused editor
- Micro-interactions
- Hover states
- Focus states
- Loading states
- Empty states
- Error states

Do not make the UI overly flashy.

Do not overuse gradients.

Do not overuse cards.

---

## 5. Main Layout

Desktop layout:

```text
┌───────────────────────────────────────────────┐
│ Top Bar                                       │
├──────────────┬────────────────────────────────┤
│              │                                │
│   Sidebar    │         Main Content            │
│              │                                │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

Sidebar may:

- Collapse
- Expand
- Resize when appropriate

Main content should have an appropriate max-width for a comfortable reading experience.

---

## 6. Authentication UI

Create complete UI for:

- Login
- Register
- Forgot Password
- Reset Password
- OAuth buttons

In the FE phase:

- No real authentication.
- Use mock authentication.
- Allow switching between authenticated/unauthenticated states.

The login flow must include loading/error/success states.

---

## 7. Workspace

Create a Workspace Switcher.

Example:

```text
Personal
Development
My Projects
```

FE functionality:

- Switch workspace
- Create workspace
- Rename workspace
- Delete workspace
- Workspace settings

Use mock data for all of these.

---

## 8. Sidebar

The sidebar should be one of the most polished components.

Include:

- Workspace switcher
- Search
- Home
- Favorites
- Recent
- Shared
- Pages tree
- Trash
- Settings

Example:

```text
Workspace

  Home
  Favorites
  Recent

  ─────────────

  📄 Projects
      📄 Frontend
          📄 React
          📄 Next.js
      📄 Backend

  📄 Interview
  📄 Notes

  ─────────────

  Trash
```

The page tree must support:

- Nested pages
- Expand/collapse
- Create child page
- Rename
- Duplicate
- Delete
- Favorite
- Context menu
- Drag & Drop

Use a recursive component for the page tree.

---

## 9. Page Management UI

Each Page contains:

- Icon
- Cover
- Title
- Content
- Breadcrumb
- Last edited information

Header:

```text
[Icon] Page Title
```

Actions:

- Favorite
- Share
- Comments
- More
- AI

Mock actions must update the UI immediately.

---

## 10. Rich Text Editor

Use Tiptap.

The editor must support:

### Text

- Paragraph
- H1
- H2
- H3

### Formatting

- Bold
- Italic
- Underline
- Strike
- Highlight
- Inline code

### Lists

- Bullet list
- Ordered list
- Task list

### Blocks

- Blockquote
- Divider
- Code block

### Media

- Image
- Link

### Table

- Table
- Table row
- Table cell

The editor must have:

- Bubble menu
- Floating toolbar
- Slash command
- Placeholder
- Keyboard shortcuts

---

## 11. Slash Commands

When the user types:

```text
/
```

Display the command menu.

Commands:

- Text
- Heading
- Heading 2
- Heading 3
- Bullet List
- Numbered List
- Checklist
- Quote
- Code
- Divider
- Image
- Table
- AI

Include command search.

Examples:

```text
/heading
/quote
/image
/ai
```

The command menu must support:

- Arrow Up
- Arrow Down
- Enter
- Escape

---

## 12. AI UI

At this stage, do NOT call an AI API.

Only build the UI and mock AI responses.

Create an AI Assistant panel.

Include:

- Ask AI
- Generate
- Rewrite
- Summarize
- Translate
- Explain
- Continue Writing

### AI Contextual Menu

When the user selects text:

- Improve Writing
- Rewrite
- Summarize
- Translate
- Explain
- Continue Writing

### AI Chat

UI includes:

- User message
- AI message
- Streaming simulation
- Input
- Send
- Stop
- Retry
- Copy
- Regenerate

In mock mode, simulate streaming responses with delays.

Later, the AI service should be replaceable:

```text
mockAIService
```

with:

```text
realAIService
```

without changing the UI.

---

## 13. Search

Create global search.

Shortcut:

```text
Cmd/Ctrl + K
```

Search modal:

- Recent
- Pages
- Workspace
- Commands

Search results must display:

- Icon
- Title
- Breadcrumb
- Matching text

Include:

- Debounce
- Keyboard navigation
- Enter
- Escape

---

## 14. Command Palette

Shortcut:

```text
Ctrl/Cmd + K
```

Commands:

- Create Page
- Search
- Open Settings
- Toggle Dark Mode
- Create Workspace
- Open Trash
- Ask AI

Support:

- Search
- Arrow navigation
- Enter
- Escape

---

## 15. Favorites

Support:

- Add favorite
- Remove favorite
- Display favorites
- Reorder favorites

The UI must update immediately using Zustand.

---

## 16. Recent Pages

Display recently opened pages.

Mock logic:

When opening a Page:

- Update `lastOpenedAt`
- Move the Page to Recent

---

## 17. Trash

Trash page:

- List deleted pages
- Restore
- Delete permanently
- Empty trash

Show a confirmation dialog before permanent deletion.

---

## 18. Sharing UI

Create a Share Dialog.

States:

- Private
- Anyone with link
- Shared with people

Permissions:

- Viewer
- Editor

No backend is needed.

Only simulate the state.

---

## 19. Comments UI

Build the comment system on the frontend.

Include:

- Comment list
- Add comment
- Reply
- Resolve
- Delete
- Mention UI

Realtime is not required yet.

---

## 20. Notifications

Create a notification center.

Types:

- Comment
- Mention
- Share
- System

Include:

- Read/unread
- Mark as read
- Mark all as read

---

## 21. Settings

Create a Settings page.

Sections:

### Account

- Name
- Avatar
- Email

### Appearance

- Light
- Dark
- System

### Editor

- Font size
- Line height
- Full width

### AI

- AI enabled
- AI model UI
- Response style

All of these are frontend state.

---

## 22. Theme

Support:

- Light
- Dark
- System

Persist the theme using localStorage.

Avoid incorrect-theme flashes during page load.

---

## 23. Responsive

Must support:

- Desktop
- Laptop
- Tablet
- Mobile

On mobile:

- Sidebar becomes a drawer.
- Editor must be responsive.
- AI panel becomes a sheet/drawer.
- Search becomes a full-screen modal.

---

## 24. Loading States

Every feature must have:

- Loading
- Skeleton
- Empty
- Error

Never leave a blank screen while loading.

---

## 25. Mock Data

Create mock data structured like a real backend.

Include entities such as:

- User
- Workspace
- WorkspaceMember
- Page
- PageVersion
- Comment
- Notification
- File
- Favorite
- AIConversation

Do not put mock data directly inside components.

---

## 26. Mock Service Layer

Create:

- `mockPageService`
- `mockWorkspaceService`
- `mockSearchService`
- `mockAIService`
- `mockCommentService`
- `mockNotificationService`

Services must return Promises to simulate API calls.

Examples:

```text
getPage(id)

createPage(data)

updatePage(id, data)

deletePage(id)

searchPages(query)

askAI(prompt)
```

Goal:

The frontend should behave as if it were calling a real Backend.

---

## 27. State Management

Use Zustand for client state.

Examples:

- `useWorkspaceStore`
- `useSidebarStore`
- `useEditorStore`
- `useUIStore`
- `useAIStore`

Do not put all state into one store.

Use TanStack Query for server/API state later.

---

## 28. Forms

Use:

- React Hook Form
- Zod

For:

- Login
- Register
- Workspace
- Page rename
- Settings
- Comments

---

## 29. Accessibility

Pay close attention to:

- Keyboard navigation
- Focus states
- `aria-label`
- Dialog accessibility
- Button accessibility
- Input labels
- Escape handling

Do not focus only on visual appearance.

---

## 30. Animation

Use Framer Motion for:

- Sidebar
- Dialog
- Command palette
- AI panel
- Dropdown
- Toast
- Page transition

Animations must be fast and subtle.

Do not overuse animation.

---

## 31. Error Handling

Create:

- Error boundary
- Not found page
- Empty states
- Toast errors
- Form validation errors

---

## 32. Performance

Consider the following from the beginning:

- Dynamic import for the editor
- Lazy loading
- Debounced search
- Memoization when genuinely needed
- Avoid re-rendering the entire page tree when editing one node
- Virtualization for large lists when necessary
- Image optimization

Do not overuse `useMemo`/`useCallback`.

---

## 33. TypeScript

Create clear types for:

- User
- Workspace
- WorkspaceMember
- Page
- PageNode
- Comment
- Notification
- AIMessage
- AIConversation
- File
- Permission
- Role

Do not use `any`.

Avoid type assertions when possible.

---

## 34. Mock Database Structure

Mock data should simulate a realistic database.

Example:

```ts
Page {
  id,
  workspaceId,
  parentId,
  title,
  icon,
  cover,
  content,
  isFavorite,
  isArchived,
  createdAt,
  updatedAt
}
```

Page uses `parentId` to support nested pages.

---

## 35. UX Requirements

Every user action must provide feedback.

### Create Page

```text
Create Page
→ Optimistic UI
→ Loading indicator
→ Success
```

### Delete Page

```text
Delete
→ Confirmation
→ Optimistic removal
→ Undo toast
```

### Save

```text
Saving...
→ Saved
```

### AI

```text
Generating...
→ Streaming
→ Complete
```

---

## 36. Do NOT Do

Do NOT:

- Build a Backend
- Create a real Database
- Create real APIs
- Call OpenAI
- Hard-code data in JSX
- Write multi-thousand-line components
- Use `any`
- Duplicate UI code
- Copy the entire Notion UI pixel-by-pixel
- Use unnecessary dependencies

---

## 37. Coding Standards

Code must be:

- Clean
- Readable
- Maintainable
- Strongly typed
- Componentized
- Reusable

Use meaningful variable names.

Do not write:

```text
data1
data2
temp
foo
bar
```

Do not create abstractions prematurely.

Prefer simple code first.

---

## 38. Development Order

Do not code the entire project at once.

Implement in this order:

### Phase 1

Project setup

↓

Layout

↓

Theme

↓

Sidebar

### Phase 2

Mock Workspace

↓

Page Tree

↓

Page CRUD

### Phase 3

Tiptap

↓

Editor

↓

Slash Commands

### Phase 4

Search

↓

Command Palette

↓

Favorites

↓

Recent

↓

Trash

### Phase 5

Upload UI

↓

Comments

↓

Share

↓

Notifications

### Phase 6

AI UI

↓

AI Chat

↓

AI Selection Menu

↓

Mock Streaming

### Phase 7

Responsive

↓

Accessibility

↓

Loading

↓

Error Handling

### Phase 8

Performance

↓

Refactor

↓

Testing

---

## 39. Testing

After completing the UI:

### Unit Tests

- Stores
- Utilities
- Search
- Page tree operations

### Component Tests

- Sidebar
- Editor toolbar
- Search
- AI panel

### E2E

```text
Login
→ Workspace
→ Create Page
→ Edit Page
→ Search
→ AI
→ Delete
→ Restore
```

---

## 40. Definition of Done

The frontend is considered complete when:

- Mock authentication works.
- Workspaces can be created.
- Pages can be created.
- Unlimited nested pages are supported.
- Pages can be renamed/deleted/restored.
- The sidebar is complete.
- A Rich Text Editor is available.
- Slash Commands are available.
- Auto-save simulation works.
- Search works.
- Command Palette works.
- Favorites work.
- Recent Pages work.
- Trash works.
- Share UI works.
- Comment UI works.
- Notification UI works.
- AI Assistant UI works.
- AI streaming simulation works.
- Dark/Light/System themes work.
- Responsive UI works.
- Loading/Empty/Error states are implemented.
- Keyboard shortcuts work.
- Basic accessibility is implemented.
- TypeScript strict mode is enabled.
- There is no unnecessary `any`.
- There are no ESLint/TypeScript errors.
- A README is included.

---

## 41. Prepare for the Backend

Although this phase is frontend-only, the code must be designed for an easy transition to a real Backend later.

Do not write:

```text
Component → directly modify mock array
```

Instead:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
Mock Service
```

Later:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
API
```

Example:

```text
usePages()
    ↓
pageService.getPages()
    ↓
mockPageService
```

Later, only replace:

```text
mockPageService
    ↓
apiPageService
```

without changing the UI.

---

## 42. Workflow

Do not create every file at once.

Work phase by phase.

After each Phase:

1. Check TypeScript.
2. Check ESLint.
3. Check the UI.
4. Check responsiveness.
5. Refactor if needed.
6. Move to the next Phase only after the current Phase is stable.

When I request a specific Phase, focus only on implementing that Phase.

Do not implement later Phases without being asked.

If you identify an architectural decision that may affect the future Backend, clearly explain the reason before implementing it.

---

## 43. Final Goal

Create a Frontend that feels like a real SaaS product, not a CRUD demo.

The project should demonstrate:

- Advanced React
- Next.js App Router
- TypeScript
- Complex state management
- Recursive UI
- Rich Text Editor
- Drag & Drop
- Search
- Command Palette
- Optimistic UI
- AI UX
- Responsive Design
- Accessibility
- Performance
- Clean Architecture

After completing the Frontend, I will build the Backend separately and replace the Mock Services with real APIs without rewriting the UI.
