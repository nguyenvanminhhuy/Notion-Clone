export type PageRole = 'viewer' | 'editor' | 'owner';

export interface Page {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  cover: string | null;
  content: string; // JSON string from Tiptap
  isFavorite: boolean;
  isArchived: boolean;
  isPublic: boolean;
  createdBy: string; // userId
  lastEditedBy: string; // userId
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface PageNode extends Page {
  children: PageNode[];
  depth: number;
  isExpanded: boolean;
}

export interface PageVersion {
  id: string;
  pageId: string;
  content: string;
  editedBy: string;
  createdAt: string;
}

export interface PageShare {
  id: string;
  pageId: string;
  userId: string | null;
  email: string | null;
  role: PageRole;
  createdAt: string;
}

export interface Breadcrumb {
  id: string;
  title: string;
  icon: string | null;
}
