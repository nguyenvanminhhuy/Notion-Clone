/**
 * pageService — thin delegation layer.
 *
 * Currently delegates to mockPageService.
 * To switch to real APIs, replace the import below:
 *   import { apiPageService as impl } from './apiPageService';
 */
import { mockPageService as impl } from '../mock/mockPageService';
import type { Page } from '../types/page';

export const pageService = {
  getPages: (workspaceId: string): Promise<Page[]> =>
    impl.getPages(workspaceId),

  getPage: (id: string): Promise<Page | null> =>
    impl.getPage(id),

  createPage: (data: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string | null;
  }): Promise<Page> => impl.createPage(data),

  updatePage: (id: string, data: Partial<Page>): Promise<Page> =>
    impl.updatePage(id, data),

  deletePage: (id: string): Promise<void> =>
    impl.deletePage(id),

  restorePage: (id: string): Promise<void> =>
    impl.restorePage(id),

  permanentDeletePage: (id: string): Promise<void> =>
    impl.permanentDeletePage(id),

  duplicatePage: (id: string): Promise<Page> =>
    impl.duplicatePage(id),

  toggleFavorite: (id: string): Promise<Page> =>
    impl.toggleFavorite(id),

  recordPageOpen: (id: string): Promise<void> =>
    impl.recordPageOpen(id),
};
