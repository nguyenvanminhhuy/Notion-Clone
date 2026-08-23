'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Star,
  Copy,
  Trash2,
  Edit2,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';
import type { Page } from '../../types/page';

interface PageContextMenuProps {
  page: Page;
  x: number;
  y: number;
  onClose: () => void;
  onRenameTrigger: () => void;
}

export function PageContextMenu({
  page,
  x,
  y,
  onClose,
  onRenameTrigger,
}: PageContextMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleFavorite, duplicatePage, deletePage, createPage } = usePageStore();

  // Close context menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const handleAction = async (action: () => Promise<any> | void) => {
    await action();
    onClose();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/page/${page.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Just copy it, or toast it if toastStore is available
    }).catch(console.error);
    onClose();
  };

  // Adjust coordinates if menu overflows the screen
  const menuWidth = 200;
  const menuHeight = 240;
  const adjustedX = typeof window !== 'undefined' && x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = typeof window !== 'undefined' && y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

  return (
    <motion.div
      ref={containerRef}
      className="page-context-menu"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      style={{
        position: 'fixed',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        zIndex: 1000,
        width: `${menuWidth}px`,
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-lg)',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <button
        className="context-menu-item"
        onClick={() => handleAction(onRenameTrigger)}
        style={itemStyle}
      >
        <Edit2 size={14} />
        <span>Rename</span>
      </button>

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => toggleFavorite(page.id))}
        style={itemStyle}
      >
        <Star size={14} className={page.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
        <span>{page.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
      </button>

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => { createPage(page.workspaceId, page.id); })}
        style={itemStyle}
      >
        <Plus size={14} />
        <span>Add child page</span>
      </button>

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => { duplicatePage(page.id); })}
        style={itemStyle}
      >
        <Copy size={14} />
        <span>Duplicate</span>
      </button>

      <button
        className="context-menu-item"
        onClick={handleCopyLink}
        style={itemStyle}
      >
        <LinkIcon size={14} />
        <span>Copy Link</span>
      </button>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border-light)', margin: '4px 0' }} />

      <button
        className="context-menu-item item-danger"
        onClick={() => handleAction(() => deletePage(page.id))}
        style={{ ...itemStyle, color: 'var(--color-danger)' }}
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </motion.div>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '6px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  textAlign: 'left',
  transition: 'background-color var(--transition-fast)',
  cursor: 'pointer',
};
