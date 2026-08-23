'use client';

import React from 'react';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Plus, BookOpen, Sparkles } from 'lucide-react';

export function EmptyPageState() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { createPage } = usePageStore();

  const handleCreatePage = () => {
    if (currentWorkspaceId) {
      createPage(currentWorkspaceId);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px',
      textAlign: 'center',
      color: 'var(--color-text-secondary)',
      backgroundColor: 'var(--color-bg)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-accent)',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <BookOpen size={32} />
      </div>

      <h2 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: '8px'
      }}>
        No page selected
      </h2>

      <p style={{
        fontSize: '14px',
        maxWidth: '320px',
        marginBottom: '24px',
        lineHeight: 1.5
      }}>
        Select a page from the sidebar or create a new one to start writing.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleCreatePage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)'
          }}
          className="hover-bg-accent-hover"
        >
          <Plus size={16} />
          <span>Create a page</span>
        </button>
      </div>
    </div>
  );
}
