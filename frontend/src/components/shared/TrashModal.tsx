'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, FileText, Search, X } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ConfirmDialog } from './ConfirmDialog';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { pages, restorePage, permanentDeletePage } = usePageStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const [filter, setFilter] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const archivedPages = useMemo(
    () => pages.filter((p) => p.workspaceId === currentWorkspaceId && p.isArchived),
    [pages, currentWorkspaceId]
  );

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? archivedPages.filter((p) => (p.title || '').toLowerCase().includes(q)) : archivedPages;
  }, [archivedPages, filter]);

  const confirmTitle = useMemo(
    () => pages.find((p) => p.id === confirmId)?.title || 'Untitled',
    [confirmId, pages]
  );

  // Keyboard: Esc closes
  React.useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.15 }}
              className="modal-panel"
              style={{ maxWidth: '520px', maxHeight: '70vh' }}
            >
              {/* Header */}
              <div className="modal-header">
                <Trash2 size={15} style={{ color: 'var(--color-text-secondary)' }} />
                <span className="modal-title">Trash</span>
                <button className="topbar-icon-btn" onClick={onClose} aria-label="Close trash">
                  <X size={15} />
                </button>
              </div>

              {/* Search filter */}
              <div className="modal-search-row">
                <Search size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Filter deleted pages…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="modal-search-input"
                  autoFocus
                />
              </div>

              {/* List */}
              <div className="modal-body">
                {filtered.length === 0 ? (
                  <div className="modal-empty">
                    <FileText size={22} />
                    <span>{archivedPages.length === 0 ? 'Trash is empty' : 'No matching pages'}</span>
                  </div>
                ) : (
                  filtered.map((page) => (
                    <div key={page.id} className="trash-item">
                      <span className="trash-item-icon">{page.icon || '📄'}</span>
                      <span className="trash-item-title">{page.title || 'Untitled'}</span>
                      <div className="trash-item-actions">
                        <button
                          className="trash-action-btn"
                          title="Restore"
                          aria-label="Restore page"
                          onClick={() => { restorePage(page.id); }}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          className="trash-action-btn danger"
                          title="Delete permanently"
                          aria-label="Delete permanently"
                          onClick={() => setConfirmId(page.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Delete permanently?"
        message={`"${confirmTitle}" and all its sub-pages will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete permanently"
        onConfirm={() => {
          if (confirmId) permanentDeletePage(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
