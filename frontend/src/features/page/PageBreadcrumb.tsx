'use client';

import React from 'react';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ChevronRight, File } from 'lucide-react';
import type { Page } from '../../types/page';

interface PageBreadcrumbProps {
  page: Page;
  onPageSelect?: (page: Page) => void;
}

export function PageBreadcrumb({ page, onPageSelect }: PageBreadcrumbProps) {
  const { pages } = usePageStore();
  const { workspaces, currentWorkspaceId } = useWorkspaceStore();
  
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  // Reconstruct path to root parent
  const buildBreadcrumbs = (currentPage: Page): Page[] => {
    const list: Page[] = [];
    let current: Page | undefined = currentPage;
    while (current) {
      list.unshift(current);
      const pId: string | null = current.parentId;
      current = pId ? pages.find((p: Page) => p.id === pId) : undefined;
    }
    return list;
  };

  const breadcrumbs = buildBreadcrumbs(page);

  return (
    <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
      {currentWorkspace && (
        <>
          <span className="breadcrumb-item" style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {currentWorkspace.name}
          </span>
          <ChevronRight size={12} className="breadcrumb-sep" style={{ color: 'var(--color-text-tertiary)' }} />
        </>
      )}
      
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            <button
              onClick={() => !isLast && onPageSelect?.(crumb)}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13.5px',
                color: isLast ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: isLast ? 600 : 500,
                cursor: isLast ? 'default' : 'pointer'
              }}
              disabled={isLast}
            >
              <span style={{ fontSize: '14px' }}>{crumb.icon ?? <File size={13} />}</span>
              <span>{crumb.title || 'Untitled'}</span>
            </button>
            {!isLast && (
              <ChevronRight size={12} className="breadcrumb-sep" style={{ color: 'var(--color-text-tertiary)' }} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
