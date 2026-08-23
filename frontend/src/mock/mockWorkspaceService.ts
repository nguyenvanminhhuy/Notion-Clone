import type { Workspace } from '../types/workspace';
import { MOCK_WORKSPACES } from './workspaces';

let store: Workspace[] = structuredClone(MOCK_WORKSPACES);

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const mockWorkspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    await delay();
    return [...store];
  },

  async createWorkspace(data: {
    name: string;
    iconEmoji?: string;
  }): Promise<Workspace> {
    await delay(120);
    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: generateId(),
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      iconEmoji: data.iconEmoji ?? '📁',
      iconUrl: null,
      plan: 'free',
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, workspace];
    return workspace;
  },

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    await delay(100);
    const index = store.findIndex((ws) => ws.id === id);
    if (index === -1) throw new Error(`Workspace ${id} not found`);
    const updated: Workspace = {
      ...store[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    store = store.map((ws) => (ws.id === id ? updated : ws));
    return updated;
  },

  async deleteWorkspace(id: string): Promise<void> {
    await delay(100);
    store = store.filter((ws) => ws.id !== id);
  },
};
