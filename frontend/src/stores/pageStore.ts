import { create } from 'zustand';
import { pageService } from '../services/pageService';
import type { Page } from '../types/page';
import { useToastStore } from './toastStore';

interface PageStore {
  pages: Page[];
  selectedPageId: string | null;
  isLoading: boolean;
  loadPages: (workspaceId: string) => Promise<void>;
  selectPage: (id: string | null) => void;
  createPage: (workspaceId: string, parentId?: string | null) => Promise<Page>;
  updatePage: (id: string, data: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  restorePage: (id: string) => Promise<void>;
  permanentDeletePage: (id: string) => Promise<void>;
  duplicatePage: (id: string) => Promise<Page>;
  toggleFavorite: (id: string) => Promise<void>;
  setPages: (pages: Page[]) => void;
}

export const usePageStore = create<PageStore>((set, get) => ({
  pages: [],
  selectedPageId: null,
  isLoading: false,

  setPages: (pages) => set({ pages }),

  loadPages: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const pages = await pageService.getPages(workspaceId);
      set({ pages, isLoading: false });
    } catch (error) {
      console.error('Failed to load pages:', error);
      set({ isLoading: false });
    }
  },

  selectPage: (id) => {
    set({ selectedPageId: id });
    if (id) {
      pageService.recordPageOpen(id).catch(console.error);
      // Update lastOpenedAt locally
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, lastOpenedAt: new Date().toISOString() } : p
        ),
      }));
    }
  },

  createPage: async (workspaceId, parentId = null) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create optimistic page
    const tempPage: Page = {
      id: tempId,
      workspaceId,
      parentId: parentId ?? null,
      title: 'Untitled',
      icon: null,
      cover: null,
      content: '{"type":"doc","content":[{"type":"paragraph"}]}',
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    // Add optimistically
    set((state) => ({
      pages: [...state.pages, tempPage],
      selectedPageId: tempId,
    }));

    try {
      const realPage = await pageService.createPage({ workspaceId, parentId, title: 'Untitled' });
      // Replace temp with real
      set((state) => ({
        pages: state.pages.map((p) => (p.id === tempId ? realPage : p)),
        selectedPageId: state.selectedPageId === tempId ? realPage.id : state.selectedPageId,
      }));
      return realPage;
    } catch (error) {
      // Revert optimistic update
      set((state) => ({
        pages: state.pages.filter((p) => p.id !== tempId),
        selectedPageId: state.selectedPageId === tempId ? null : state.selectedPageId,
      }));
      useToastStore.getState().addToast({
        message: 'Failed to create page',
        type: 'error',
      });
      throw error;
    }
  },

  updatePage: async (id, data) => {
    const previousPages = get().pages;

    // Optimistic update
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }));

    try {
      await pageService.updatePage(id, data);
    } catch (error) {
      // Revert on failure
      set({ pages: previousPages });
      useToastStore.getState().addToast({
        message: 'Failed to update page',
        type: 'error',
      });
      console.error(error);
    }
  },

  deletePage: async (id) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page) return;

    const previousPages = get().pages;

    // Helper to find all descendant IDs
    const getDescendantIds = (parentId: string, allPages: Page[]): string[] => {
      const children = allPages.filter((p) => p.parentId === parentId);
      return children.flatMap((c) => [c.id, ...getDescendantIds(c.id, allPages)]);
    };
    const affectedIds = [id, ...getDescendantIds(id, previousPages)];

    // Optimistic delete: soft delete (isArchived = true)
    set((state) => ({
      pages: state.pages.map((p) =>
        affectedIds.includes(p.id) ? { ...p, isArchived: true } : p
      ),
      selectedPageId: state.selectedPageId === id ? null : state.selectedPageId,
    }));

    // Show toast with Undo action
    useToastStore.getState().addToast({
      message: `"${page.title || 'Untitled'}" moved to Trash.`,
      type: 'info',
      action: {
        label: 'Undo',
        onClick: async () => {
          // Revert soft delete in service and store
          try {
            await pageService.restorePage(id);
            set((state) => ({
              pages: state.pages.map((p) =>
                affectedIds.includes(p.id) ? { ...p, isArchived: false } : p
              ),
              selectedPageId: id,
            }));
            useToastStore.getState().addToast({
              message: 'Page restored',
              type: 'success',
            });
          } catch (e) {
            console.error('Failed to restore page:', e);
          }
        },
      },
    });

    try {
      await pageService.deletePage(id);
    } catch (error) {
      // Revert on failure
      set({ pages: previousPages });
      useToastStore.getState().addToast({
        message: 'Failed to delete page',
        type: 'error',
      });
      console.error(error);
    }
  },

  restorePage: async (id) => {
    try {
      await pageService.restorePage(id);
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, isArchived: false } : p
        ),
      }));
      useToastStore.getState().addToast({
        message: 'Page restored',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to restore page:', error);
      useToastStore.getState().addToast({
        message: 'Failed to restore page',
        type: 'error',
      });
    }
  },

  permanentDeletePage: async (id) => {
    const page = get().pages.find((p) => p.id === id);
    const title = page?.title || 'Untitled';
    try {
      await pageService.permanentDeletePage(id);
      set((state) => ({
        pages: state.pages.filter((p) => p.id !== id),
      }));
      useToastStore.getState().addToast({
        message: `"${title}" permanently deleted.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to permanently delete page:', error);
      useToastStore.getState().addToast({
        message: 'Failed to permanently delete page',
        type: 'error',
      });
    }
  },

  duplicatePage: async (id) => {
    try {
      const duplicated = await pageService.duplicatePage(id);
      set((state) => ({
        pages: [...state.pages, duplicated],
      }));
      useToastStore.getState().addToast({
        message: 'Page duplicated',
        type: 'success',
      });
      return duplicated;
    } catch (error) {
      console.error('Failed to duplicate page:', error);
      useToastStore.getState().addToast({
        message: 'Failed to duplicate page',
        type: 'error',
      });
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page) return;
    const newFavoriteStatus = !page.isFavorite;

    // Optimistic toggle
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, isFavorite: newFavoriteStatus } : p
      ),
    }));

    try {
      await pageService.toggleFavorite(id);
    } catch (error) {
      // Revert on failure
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, isFavorite: !newFavoriteStatus } : p
        ),
      }));
      useToastStore.getState().addToast({
        message: 'Failed to update favorite status',
        type: 'error',
      });
      console.error(error);
    }
  },
}));
