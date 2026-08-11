import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  isOpen: boolean;
  width: number;
  expandedPageIds: Set<string>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  togglePageExpanded: (pageId: string) => void;
  setPageExpanded: (pageId: string, expanded: boolean) => void;
  isPageExpanded: (pageId: string) => boolean;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isOpen: true,
      width: 260,
      expandedPageIds: new Set<string>(),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),

      setSidebarOpen: (open: boolean) => set({ isOpen: open }),

      setSidebarWidth: (width: number) => set({ width }),

      togglePageExpanded: (pageId: string) => {
        const current = get().expandedPageIds;
        const next = new Set(current);
        if (next.has(pageId)) {
          next.delete(pageId);
        } else {
          next.add(pageId);
        }
        set({ expandedPageIds: next });
      },

      setPageExpanded: (pageId: string, expanded: boolean) => {
        const current = get().expandedPageIds;
        const next = new Set(current);
        if (expanded) {
          next.add(pageId);
        } else {
          next.delete(pageId);
        }
        set({ expandedPageIds: next });
      },

      isPageExpanded: (pageId: string) => {
        return get().expandedPageIds.has(pageId);
      },
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({
        isOpen: state.isOpen,
        width: state.width,
        expandedPageIds: Array.from(state.expandedPageIds),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SidebarStore>),
        expandedPageIds: new Set(
          Array.isArray((persisted as { expandedPageIds?: string[] }).expandedPageIds)
            ? (persisted as { expandedPageIds: string[] }).expandedPageIds
            : []
        ),
      }),
    }
  )
);
