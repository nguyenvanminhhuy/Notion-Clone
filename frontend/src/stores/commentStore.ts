import { create } from 'zustand';
import { commentService } from '../services/commentService';
import type { Comment } from '../types/comment';
import { useToastStore } from './toastStore';

interface CommentStore {
  comments: Record<string, Comment[]>; // Keyed by pageId
  isLoading: boolean;
  loadComments: (pageId: string) => Promise<void>;
  createComment: (pageId: string, content: string) => Promise<void>;
  replyToComment: (pageId: string, commentId: string, content: string) => Promise<void>;
  resolveComment: (pageId: string, commentId: string) => Promise<void>;
  deleteComment: (pageId: string, commentId: string) => Promise<void>;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: {},
  isLoading: false,

  loadComments: async (pageId) => {
    set({ isLoading: true });
    try {
      const data = await commentService.getComments(pageId);
      set((state) => ({
        comments: { ...state.comments, [pageId]: data },
        isLoading: false,
      }));
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  createComment: async (pageId, content) => {
    try {
      const newComment = await commentService.createComment({ pageId, content });
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        return { comments: { ...state.comments, [pageId]: [...pageComments, newComment] } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to add comment', type: 'error' });
    }
  },

  replyToComment: async (pageId, commentId, content) => {
    try {
      const reply = await commentService.replyToComment(commentId, content);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const updated = pageComments.map((c) => 
          c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
        );
        return { comments: { ...state.comments, [pageId]: updated } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to reply', type: 'error' });
    }
  },

  resolveComment: async (pageId, commentId) => {
    try {
      const updated = await commentService.resolveComment(commentId);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const mapped = pageComments.map((c) => 
          c.id === commentId ? { ...c, resolved: updated.resolved } : c
        );
        return { comments: { ...state.comments, [pageId]: mapped } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to resolve comment', type: 'error' });
    }
  },

  deleteComment: async (pageId, commentId) => {
    try {
      await commentService.deleteComment(commentId);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const updated = pageComments.filter((c) => c.id !== commentId);
        return { comments: { ...state.comments, [pageId]: updated } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to delete comment', type: 'error' });
    }
  },
}));
