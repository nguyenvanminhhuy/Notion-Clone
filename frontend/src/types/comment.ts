export interface Comment {
  id: string;
  pageId: string;
  userId: string;
  content: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}
