import { httpClient } from './api/httpClient';
import type { Comment, CommentReply } from '../types/comment';

interface BackendCommentReplyDto {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  content: string;
  createdAt: string;
}

interface BackendCommentDto {
  id: string;
  pageId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  content: string;
  createdAt: string;
  resolved: boolean;
  replies: BackendCommentReplyDto[];
}

function mapReply(dto: BackendCommentReplyDto): CommentReply {
  return {
    id: dto.id,
    userId: dto.userId,
    userName: dto.userName,
    userAvatarUrl: dto.userAvatarUrl,
    content: dto.content,
    createdAt: dto.createdAt,
  };
}

function mapComment(dto: BackendCommentDto): Comment {
  return {
    id: dto.id,
    pageId: dto.pageId,
    userId: dto.userId,
    userName: dto.userName,
    userAvatarUrl: dto.userAvatarUrl,
    content: dto.content,
    createdAt: dto.createdAt,
    resolved: Boolean(dto.resolved),
    replies: (dto.replies || []).map(mapReply),
  };
}

export const commentService = {
  async getComments(pageId: string): Promise<Comment[]> {
    const list = await httpClient.get<BackendCommentDto[]>(`/api/pages/${pageId}/comments`);
    return list.map(mapComment);
  },

  async createComment(data: { pageId: string; content: string }): Promise<Comment> {
    const dto = await httpClient.post<BackendCommentDto>(`/api/pages/${data.pageId}/comments`, {
      content: data.content,
    });
    return mapComment(dto);
  },

  async replyToComment(commentId: string, content: string): Promise<CommentReply> {
    const dto = await httpClient.post<BackendCommentReplyDto>(`/api/comments/${commentId}/reply`, {
      content,
    });
    return mapReply(dto);
  },

  async resolveComment(commentId: string): Promise<Comment> {
    const dto = await httpClient.patch<BackendCommentDto>(`/api/comments/${commentId}/resolve`);
    return mapComment(dto);
  },

  async deleteComment(commentId: string): Promise<void> {
    await httpClient.delete(`/api/comments/${commentId}`);
  },
};
