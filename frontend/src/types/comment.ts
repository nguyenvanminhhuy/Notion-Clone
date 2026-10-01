export interface Comment {
  id: string;
  pageId: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}
