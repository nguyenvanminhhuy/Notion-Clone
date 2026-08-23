import { mockWorkspaceService as impl } from '../mock/mockWorkspaceService';
import type { Workspace } from '../types/workspace';

export const workspaceService = {
  getWorkspaces: (): Promise<Workspace[]> => impl.getWorkspaces(),

  createWorkspace: (data: { name: string; iconEmoji?: string }): Promise<Workspace> =>
    impl.createWorkspace(data),

  updateWorkspace: (id: string, data: Partial<Workspace>): Promise<Workspace> =>
    impl.updateWorkspace(id, data),

  deleteWorkspace: (id: string): Promise<void> => impl.deleteWorkspace(id),
};
