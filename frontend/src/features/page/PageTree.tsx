'use client';

import React, { useEffect } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { PageTreeItem } from './PageTreeItem';
import { FileText, Loader2 } from 'lucide-react';
import type { Page } from '../../types/page';

interface PageTreeProps {
  workspaceId: string;
  selectedPageId?: string | null;
  onPageSelect?: (page: Page) => void;
}

export function PageTree({
  workspaceId,
  selectedPageId,
  onPageSelect,
}: PageTreeProps) {
  const { pages, isLoading, loadPages } = usePageStore();

  useEffect(() => {
    if (workspaceId) {
      loadPages(workspaceId);
    }
  }, [workspaceId, loadPages]);

  if (isLoading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center p-4" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        color: 'var(--color-text-tertiary)',
        fontSize: '13px',
        gap: '6px'
      }}>
        <Loader2 size={16} className="animate-spin" />
        <span>Loading pages...</span>
      </div>
    );
  }

  // Get unarchived root-level pages for this workspace
  const rootPages = pages
    .filter((p) => p.workspaceId === workspaceId && !p.isArchived && p.parentId === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (rootPages.length === 0) {
    return (
      <div className="sidebar-empty">
        <FileText size={16} />
        <span>No pages yet</span>
      </div>
    );
  }

  return (
    <div role="tree" aria-label="Page tree" className="page-tree">
      {rootPages.map((page) => (
        <PageTreeItem
          key={page.id}
          page={page}
          depth={0}
          onSelect={onPageSelect}
          selectedPageId={selectedPageId}
        />
      ))}
    </div>
  );
}
