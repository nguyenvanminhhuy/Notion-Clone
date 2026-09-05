'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentInput({ onSubmit, placeholder = 'Add a comment...', autoFocus = false }: CommentInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-input-form" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
          fontSize: '13px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={!content.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-md)',
          background: content.trim() ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
          color: content.trim() ? '#fff' : 'var(--color-text-tertiary)',
          border: 'none',
          cursor: content.trim() ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s',
        }}
      >
        <Send size={14} />
      </button>
    </form>
  );
}
