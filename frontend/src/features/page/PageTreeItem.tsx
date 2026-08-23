'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Plus, MoreHorizontal, File, Grab } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '../../stores/sidebarStore';
import { usePageStore } from '../../stores/pageStore';
import { PageContextMenu } from './PageContextMenu';
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
  const { isPageExpanded, togglePageExpanded, setPageExpanded } = useSidebarStore();
  const { pages, updatePage, createPage } = usePageStore();
  const [isHovered, setIsHovered] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  // Inline Renaming State
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleValue, setTitleValue] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync titleValue when page.title updates
  useEffect(() => {
    setTitleValue(page.title);
  }, [page.title]);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Filter children from state
  const children = pages
    .filter((p) => p.parentId === page.id && !p.isArchived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const hasChildren = children.length > 0;
  const expanded = isPageExpanded(page.id);
  const isSelected = selectedPageId === page.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      togglePageExpanded(page.id);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (isRenaming) return;
    onSelect?.(page);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 4 });
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPageExpanded(page.id, true);
    try {
      await createPage(page.workspaceId, page.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameSubmit = async () => {
    setIsRenaming(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== page.title) {
      await updatePage(page.id, { title: trimmed });
    } else {
      setTitleValue(page.title); // revert
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setTitleValue(page.title);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={`page-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={isSelected}
      >
        {/* Drag handle (visual indicator of premium UI) */}
        <span
          className={`page-tree-drag-handle ${isHovered ? 'visible' : 'invisible'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12px',
            color: 'var(--color-text-tertiary)',
            marginRight: '2px',
            cursor: 'grab'
          }}
        >
          <Grab size={12} />
        </span>

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

        {/* Page title or input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            className="page-tree-rename-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-accent)',
              borderRadius: '4px',
              padding: '1px 4px',
              fontSize: '13.5px',
              color: 'var(--color-text-primary)',
              outline: 'none',
              width: '100%',
            }}
          />
        ) : (
          <span
            className="page-tree-title"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
          >
            {page.title || 'Untitled'}
          </span>
        )}

        {/* Hover actions */}
        {isHovered && !isRenaming && (
          <div className="page-tree-actions" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              className="page-tree-action-btn"
              onClick={handleMoreClick}
              aria-label="More options"
            >
              <MoreHorizontal size={14} />
            </button>
            <button
              className="page-tree-action-btn"
              onClick={handleAddChild}
              aria-label="Add child page"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu && (
          <PageContextMenu
            page={page}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onRenameTrigger={() => setIsRenaming(true)}
          />
        )}
      </AnimatePresence>

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
