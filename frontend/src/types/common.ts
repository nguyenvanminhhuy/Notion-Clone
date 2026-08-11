export type NotificationType = 'comment' | 'mention' | 'share' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  pageId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  pageId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  pageId: string | null;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  pageId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}
