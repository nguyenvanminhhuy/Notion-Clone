'use client';

import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommentStore } from '../../stores/commentStore';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

interface CommentListProps {
  pageId: string;
}

export function CommentList({ pageId }: CommentListProps) {
  const { comments, loadComments, createComment, isLoading } = useCommentStore();
  const pageComments = comments[pageId] || [];

  useEffect(() => {
    if (pageId) {
      loadComments(pageId);
    }
  }, [pageId, loadComments]);

  const activeComments = pageComments.filter(c => !c.resolved);

  return (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Comments</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
            Loading comments...
          </div>
        ) : activeComments.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={32} style={{ opacity: 0.5 }} />
            <span>No comments yet. Start the conversation!</span>
          </div>
        ) : (
          activeComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} pageId={pageId} />
          ))
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
        <CommentInput onSubmit={(content) => createComment(pageId, content)} />
      </div>
    </div>
  );
}
