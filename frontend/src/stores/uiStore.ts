import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIStore {
  theme: Theme;
  isMobileSidebarOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAIPanelOpen: boolean;
  isUploadOpen: boolean;
  isCommentsOpen: boolean;
  isShareOpen: boolean;
  isNotificationsOpen: boolean;
  uploadCallback: ((url: string) => void) | null;
  setTheme: (theme: Theme) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
  openUploadDialog: (callback: (url: string) => void) => void;
  closeUploadDialog: () => void;
  setCommentsOpen: (open: boolean) => void;
  toggleComments: () => void;
  setShareOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      isMobileSidebarOpen: false,
      isSearchOpen: false,
      isCommandPaletteOpen: false,
      isAIPanelOpen: false,
      isUploadOpen: false,
      isCommentsOpen: false,
      isShareOpen: false,
      isNotificationsOpen: false,
      uploadCallback: null,

      setTheme: (theme: Theme) => set({ theme }),

      setMobileSidebarOpen: (open: boolean) => set({ isMobileSidebarOpen: open }),

      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

      setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),

      setAIPanelOpen: (open: boolean) => set({ isAIPanelOpen: open }),

      openUploadDialog: (callback) => set({ isUploadOpen: true, uploadCallback: callback }),

      closeUploadDialog: () => set({ isUploadOpen: false, uploadCallback: null }),
      
      setCommentsOpen: (open: boolean) => set({ isCommentsOpen: open }),
      
      toggleComments: () => set((state) => ({ isCommentsOpen: !state.isCommentsOpen })),
      
      setShareOpen: (open: boolean) => set({ isShareOpen: open }),

      setNotificationsOpen: (open: boolean) => set({ isNotificationsOpen: open }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
