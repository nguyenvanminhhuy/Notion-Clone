'use client';

import React, { useState } from 'react';
import { Check, Reply, Trash2, User } from 'lucide-react';
import type { Comment } from '../../types/comment';
import { CommentInput } from './CommentInput';
import { useCommentStore } from '../../stores/commentStore';

interface CommentItemProps {
  comment: Comment;
  pageId: string;
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CommentItem({ comment, pageId }: CommentItemProps) {
  const { resolveComment, deleteComment, replyToComment } = useCommentStore();
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = (content: string) => {
    replyToComment(pageId, comment.id, content);
    setIsReplying(false);
  };

  if (comment.resolved) return null; // Hide resolved comments from main list for now

  return (
    <div className="comment-item" style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={14} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{comment.userId}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatTime(comment.createdAt)}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
            {comment.content}
          </p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {comment.replies.map(reply => (
             <div key={reply.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
               <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                 <User size={12} style={{ color: 'var(--color-text-secondary)' }} />
               </div>
               <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{reply.userId}</span>
                   <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatTime(reply.createdAt)}</span>
                 </div>
                 <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: 0, wordBreak: 'break-word' }}>
                   {reply.content}
                 </p>
               </div>
             </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginLeft: '32px', marginTop: '4px' }}>
        <button 
          onClick={() => setIsReplying(!isReplying)}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-tertiary)', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Reply size={12} /> Reply
        </button>
        <button 
          onClick={() => resolveComment(pageId, comment.id)}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-tertiary)', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Check size={12} /> Resolve
        </button>
        <button 
          onClick={() => deleteComment(pageId, comment.id)}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-tertiary)', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isReplying && (
        <div style={{ marginLeft: '32px' }}>
          <CommentInput onSubmit={handleReply} placeholder="Reply to comment..." autoFocus />
        </div>
      )}
    </div>
  );
}
