import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIStore {
  theme: Theme;
  isMobileSidebarOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAIPanelOpen: boolean;
  setTheme: (theme: Theme) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      isMobileSidebarOpen: false,
      isSearchOpen: false,
      isCommandPaletteOpen: false,
      isAIPanelOpen: false,

      setTheme: (theme: Theme) => set({ theme }),

      setMobileSidebarOpen: (open: boolean) => set({ isMobileSidebarOpen: open }),

      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

      setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),

      setAIPanelOpen: (open: boolean) => set({ isAIPanelOpen: open }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
