import { create } from 'zustand';
import { mockCommentService } from '../mock/mockCommentService';
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
      const data = await mockCommentService.getComments(pageId);
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
      const newComment = await mockCommentService.createComment({ pageId, content });
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
      const reply = await mockCommentService.replyToComment(commentId, content);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const updated = pageComments.map((c) => 
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
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
      await mockCommentService.resolveComment(commentId);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const updated = pageComments.map((c) => 
          c.id === commentId ? { ...c, resolved: true } : c
        );
        return { comments: { ...state.comments, [pageId]: updated } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to resolve comment', type: 'error' });
    }
  },

  deleteComment: async (pageId, commentId) => {
    try {
      await mockCommentService.deleteComment(commentId);
      set((state) => {
        const pageComments = state.comments[pageId] || [];
        const updated = pageComments.filter((c) => c.id !== commentId);
        return { comments: { ...state.comments, [pageId]: updated } };
      });
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast({ message: 'Failed to delete comment', type: 'error' });
    }
  }
}));
