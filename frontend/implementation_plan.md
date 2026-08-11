# AI-Powered Notion Clone — Implementation Plan

## Overview

Build a production-ready Notion Clone Frontend using **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4**, following the 8-phase development order from `agent-en.md`.

The project currently has a bare Next.js scaffold with no features. We will implement **Phase 1** first.

---

## User Review Required

> [!IMPORTANT]
> The spec says "work phase by phase" and "Do not implement later Phases without being asked." This plan covers **Phase 1 only**. Subsequent phases will be planned and implemented separately upon request.

> [!IMPORTANT]
> The project uses **Next.js 16 + Tailwind CSS v4** (already installed). The spec requires shadcn/ui, Zustand, Framer Motion, Lucide React, and other packages that are NOT yet installed. We will install them as part of Phase 1 setup.

---

## Open Questions

> [!NOTE]
> The spec mentions shadcn/ui which requires initialization (`npx shadcn@latest init`). This modifies `globals.css`, `tailwind.config`, and creates `components/ui/`. Proceeding with this standard setup.

> [!NOTE]
> Tailwind CSS v4 uses a CSS-first config (no `tailwind.config.ts` file). shadcn/ui v4+ supports this. We'll use the compatible setup path.

---

## Phase 1: Project Setup → Layout → Theme → Sidebar

### What Phase 1 Delivers

- Full project setup with all required dependencies
- Feature-based folder structure (`src/`)
- Design system (CSS variables, color tokens, typography)
- Dark/Light/System theme with localStorage persistence (no flash)
- Main application shell: TopBar + Sidebar + Main Content area
- Collapsible, polished Sidebar with:
  - Workspace switcher (mock data)
  - Navigation items (Home, Favorites, Recent, Shared)
  - Page tree (recursive, expand/collapse, mock data)
  - Trash link, Settings link
- Zustand stores: `useSidebarStore`, `useWorkspaceStore`, `useUIStore`
- Mock data: User, Workspace, Pages (nested tree)
- Framer Motion animations for sidebar open/close

---

## Proposed Changes

### Dependencies to Install

```bash
pnpm add zustand framer-motion lucide-react @tanstack/react-query zod react-hook-form
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm dlx shadcn@canary init   # shadcn with Tailwind v4 support
```

---

### Folder Structure (to be created)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css          (move existing)
│   └── layout.tsx           (update root layout)
│
├── components/
│   ├── ui/                  (shadcn components)
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx
│   │   └── SidebarSection.tsx
│   └── shared/
│       └── ThemeProvider.tsx
│
├── features/
│   ├── workspace/
│   │   └── WorkspaceSwitcher.tsx
│   └── page/
│       └── PageTreeItem.tsx
│
├── stores/
│   ├── sidebarStore.ts
│   ├── workspaceStore.ts
│   └── uiStore.ts
│
├── mock/
│   ├── users.ts
│   ├── workspaces.ts
│   └── pages.ts
│
├── types/
│   ├── user.ts
│   ├── workspace.ts
│   └── page.ts
│
└── config/
    └── navigation.ts
```

---

### Component Details

#### [MODIFY] [layout.tsx](file:///d:/Huy/NotionClone/frontend/app/layout.tsx)
- Add ThemeProvider with `suppressHydrationWarning` to prevent dark/light flash
- Add Google Fonts (Inter)
- Wrap with TanStack QueryClientProvider

#### [NEW] src/components/shared/ThemeProvider.tsx
- Reads theme from localStorage on mount
- Applies `dark` class to `<html>`
- Listens for system preference changes

#### [NEW] src/components/layout/AppShell.tsx
- Flex container: Sidebar (fixed width, collapsible) + Main Content
- Responsive: sidebar becomes drawer on mobile

#### [NEW] src/components/layout/Sidebar.tsx
- WorkspaceSwitcher at top
- Nav items: Home, Favorites, Recent, Shared with Lucide icons
- Divider
- Recursive PageTree
- Bottom: Trash, Settings
- Collapse/expand with Framer Motion slide animation

#### [NEW] src/components/layout/TopBar.tsx
- Breadcrumb (mock)
- Right actions: Search (Ctrl+K hint), Notifications, User avatar

#### [NEW] src/features/workspace/WorkspaceSwitcher.tsx
- Shows current workspace name
- Dropdown to switch between mock workspaces

#### [NEW] src/features/page/PageTreeItem.tsx
- Recursive component
- Shows icon + title
- Expand/collapse chevron
- Context menu (coming in Phase 2, placeholder for now)

#### [NEW] src/stores/sidebarStore.ts
```ts
interface SidebarStore {
  isOpen: boolean
  width: number
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}
```

#### [NEW] src/stores/workspaceStore.ts
```ts
interface WorkspaceStore {
  currentWorkspaceId: string
  workspaces: Workspace[]
  setCurrentWorkspace: (id: string) => void
}
```

#### [NEW] src/stores/uiStore.ts
```ts
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: Theme) => void
}
```

#### [NEW] src/mock/users.ts, workspaces.ts, pages.ts
- Realistic mock data with proper TypeScript types
- Nested page tree (3 levels deep)

#### [NEW] src/types/user.ts, workspace.ts, page.ts
- Strict TypeScript interfaces matching the mock database structure from section 34

---

## Verification Plan

### Automated Tests
- `pnpm lint` — no ESLint errors
- `pnpm build` — TypeScript compiles without errors

### Manual Verification
- App loads at `localhost:3000`
- Dark/light theme toggle works, persists on reload
- Sidebar collapses/expands with smooth animation
- Workspace switcher shows mock workspaces
- Page tree renders nested pages with expand/collapse
- No console errors
- Responsive layout: sidebar becomes drawer on mobile (≤768px)
