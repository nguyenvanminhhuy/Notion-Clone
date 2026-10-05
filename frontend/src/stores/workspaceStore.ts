import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { workspaceService } from '../services/workspaceService';
import type { Workspace } from '../types/workspace';
import { useToastStore } from './toastStore';
import { logError, getErrorMessage } from '../lib/errorHandler';

interface WorkspaceStore {
  currentWorkspaceId: string;
  workspaces: Workspace[];
  isLoading: boolean;
  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (id: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  createWorkspace: (data: { name: string; iconEmoji?: string; iconUrl?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  getCurrentWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      currentWorkspaceId: '',
      workspaces: [],
      isLoading: false,

      loadWorkspaces: async () => {
        set({ isLoading: true });
        try {
          const workspaces = await workspaceService.getWorkspaces();
          const { currentWorkspaceId } = get();
          const validCurrentId =
            workspaces.some((w) => w.id === currentWorkspaceId)
              ? currentWorkspaceId
              : workspaces[0]?.id ?? '';

          set({
            workspaces,
            currentWorkspaceId: validCurrentId,
            isLoading: false,
          });
        } catch (error) {
          logError('workspaceStore.loadWorkspaces', error);
          set({ isLoading: false });
          // Only toast if it's a real error (not just unauthenticated on first load)
          const msg = getErrorMessage(error);
          if (!msg.includes('session') && !msg.includes('sign in')) {
            useToastStore.getState().addToast({ message: msg, type: 'error', duration: 5000 });
          }
        }
      },

      setCurrentWorkspace: (id: string) => set({ currentWorkspaceId: id }),

      addWorkspace: (workspace: Workspace) =>
        set((state) => ({ workspaces: [...state.workspaces, workspace] })),

      createWorkspace: async (data) => {
        set({ isLoading: true });
        try {
          const created = await workspaceService.createWorkspace(data);
          set((state) => ({
            workspaces: [...state.workspaces, created],
            currentWorkspaceId: created.id,
            isLoading: false,
          }));
          useToastStore.getState().addToast({
            message: `Workspace "${created.name}" created`,
            type: 'success',
          });
          return created;
        } catch (error) {
          set({ isLoading: false });
          useToastStore.getState().addToast({
            message: 'Failed to create workspace',
            type: 'error',
          });
          throw error;
        }
      },

      updateWorkspace: async (id: string, data: Partial<Workspace>) => {
        const prevWorkspaces = get().workspaces;
        // Optimistic update
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...data, updatedAt: new Date().toISOString() } : ws
          ),
        }));

        try {
          const updated = await workspaceService.updateWorkspace(id, data);
          set((state) => ({
            workspaces: state.workspaces.map((ws) => (ws.id === id ? updated : ws)),
          }));
        } catch (error) {
          set({ workspaces: prevWorkspaces });
          useToastStore.getState().addToast({
            message: 'Failed to update workspace',
            type: 'error',
          });
          throw error;
        }
      },

      deleteWorkspace: async (id: string) => {
        const prevWorkspaces = get().workspaces;
        const remaining = prevWorkspaces.filter((ws) => ws.id !== id);
        const newCurrentId =
          get().currentWorkspaceId === id
            ? remaining[0]?.id ?? ''
            : get().currentWorkspaceId;

        set({ workspaces: remaining, currentWorkspaceId: newCurrentId });

        try {
          await workspaceService.deleteWorkspace(id);
          useToastStore.getState().addToast({
            message: 'Workspace deleted',
            type: 'info',
          });
        } catch (error) {
          set({ workspaces: prevWorkspaces });
          useToastStore.getState().addToast({
            message: 'Failed to delete workspace',
            type: 'error',
          });
          throw error;
        }
      },

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find((ws) => ws.id === currentWorkspaceId);
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
      }),
    }
  )
);
