import type { Comment, CommentReply } from '../types/comment';

let store: Comment[] = [
  {
    id: 'c1',
    pageId: 'page-1', // Assuming this page exists in mock data
    userId: 'user-2',
    content: 'This looks like a great start! Should we add more details about the frontend architecture?',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolved: false,
    replies: [
      {
        id: 'r1',
        userId: 'user-1',
        content: 'Good idea, I will update the section later today.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      }
    ]
  }
];

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const mockCommentService = {
  async getComments(pageId: string): Promise<Comment[]> {
    await delay();
    return store.filter((c) => c.pageId === pageId);
  },

  async createComment(data: { pageId: string; content: string }): Promise<Comment> {
    await delay();
    const newComment: Comment = {
      id: generateId(),
      pageId: data.pageId,
      userId: 'user-1', // current user mock
      content: data.content,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    store.push(newComment);
    return newComment;
  },

  async replyToComment(commentId: string, content: string): Promise<CommentReply> {
    await delay();
    const comment = store.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    const reply: CommentReply = {
      id: generateId(),
      userId: 'user-1',
      content,
      createdAt: new Date().toISOString(),
    };
    comment.replies.push(reply);
    return reply;
  },

  async resolveComment(commentId: string): Promise<void> {
    await delay();
    const comment = store.find((c) => c.id === commentId);
    if (comment) {
      comment.resolved = true;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    await delay();
    store = store.filter((c) => c.id !== commentId);
  }
};
