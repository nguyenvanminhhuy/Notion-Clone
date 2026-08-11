import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_WORKSPACES, DEFAULT_WORKSPACE_ID } from '../mock/workspaces';
import type { Workspace } from '../types/workspace';

interface WorkspaceStore {
  currentWorkspaceId: string;
  workspaces: Workspace[];
  setCurrentWorkspace: (id: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  getCurrentWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      currentWorkspaceId: DEFAULT_WORKSPACE_ID,
      workspaces: MOCK_WORKSPACES,

      setCurrentWorkspace: (id: string) => set({ currentWorkspaceId: id }),

      addWorkspace: (workspace: Workspace) =>
        set((state) => ({ workspaces: [...state.workspaces, workspace] })),

      updateWorkspace: (id: string, data: Partial<Workspace>) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...data, updatedAt: new Date().toISOString() } : ws
          ),
        })),

      deleteWorkspace: (id: string) =>
        set((state) => {
          const remaining = state.workspaces.filter((ws) => ws.id !== id);
          const newCurrentId =
            state.currentWorkspaceId === id
              ? (remaining[0]?.id ?? '')
              : state.currentWorkspaceId;
          return { workspaces: remaining, currentWorkspaceId: newCurrentId };
        }),

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find((ws) => ws.id === currentWorkspaceId);
      },
    }),
    {
      name: 'workspace-store',
    }
  )
);
