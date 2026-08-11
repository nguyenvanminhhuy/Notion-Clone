'use client';

import { useState } from 'react';
import { ChevronRight, Plus, MoreHorizontal, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '../../stores/sidebarStore';
import { MOCK_PAGES, getChildPages } from '../../mock/pages';
import type { Page } from '../../types/page';

interface PageTreeItemProps {
  page: Page;
  depth?: number;
  onSelect?: (page: Page) => void;
  selectedPageId?: string | null;
}

export function PageTreeItem({
  page,
  depth = 0,
  onSelect,
  selectedPageId,
}: PageTreeItemProps) {
  const { isPageExpanded, togglePageExpanded } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);

  const children = getChildPages(MOCK_PAGES, page.id);
  const hasChildren = children.length > 0;
  const expanded = isPageExpanded(page.id);
  const isSelected = selectedPageId === page.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      togglePageExpanded(page.id);
    }
  };

  const handleSelect = () => {
    onSelect?.(page);
  };

  return (
    <div>
      <div
        className={`page-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelect}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={isSelected}
      >
        {/* Chevron toggle */}
        <button
          className={`page-tree-chevron ${hasChildren ? 'visible' : 'invisible'}`}
          onClick={handleToggle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          tabIndex={-1}
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Page icon */}
        <span className="page-tree-icon">
          {page.icon ?? <File size={14} />}
        </span>

        {/* Page title */}
        <span className="page-tree-title">{page.title || 'Untitled'}</span>

        {/* Hover actions */}
        {isHovered && (
          <div className="page-tree-actions">
            <button
              className="page-tree-action-btn"
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreHorizontal size={14} />
            </button>
            <button
              className="page-tree-action-btn"
              onClick={(e) => e.stopPropagation()}
              aria-label="Add child page"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children.map((child) => (
              <PageTreeItem
                key={child.id}
                page={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedPageId={selectedPageId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
