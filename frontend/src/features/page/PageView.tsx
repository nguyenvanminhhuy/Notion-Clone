'use client';

import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { useUIStore } from '../../stores/uiStore';
import { PageHeader } from './PageHeader';
import { EditorSaveStatus } from '../editor/EditorSaveStatus';
import { CommentList } from '../comments/CommentList';
import {
  Star,
  Share2,
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import type { Page } from '../../types/page';
import { pageService } from '../../services/pageService';

// Dynamically import Editor to avoid SSR issues with ProseMirror DOM APIs
const Editor = lazy(() =>
  import('../editor/Editor').then((mod) => ({ default: mod.Editor }))
);

interface PageViewProps {
  pageId: string;
  onBackToDashboard?: () => void;
}

export function PageView({ pageId, onBackToDashboard }: PageViewProps) {
  const { pages, updatePage, toggleFavorite, selectPage } = usePageStore();
  const { isCommentsOpen, toggleComments, setShareOpen } = useUIStore();
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Mark this page as selected in the store (highlights it in the sidebar)
  useEffect(() => {
    selectPage(pageId);
  }, [pageId, selectPage]);

  // Fetch current page from mock service
  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(null);
    pageService
      .getPage(pageId)
      .then((page) => {
        setCurrentPage(page);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [pageId]);

  // Sync local state when the page updates in the store (e.g. title rename)
  useEffect(() => {
    const updated = pages.find((p) => p.id === pageId);
    if (updated) {
      setCurrentPage(updated);
    }
  }, [pages, pageId]);

  const handleSaveContent = useCallback(
    async (content: string) => {
      if (!currentPage) return;
      setIsSaving(true);
      await updatePage(currentPage.id, { content });
      setIsSaving(false);
      setLastSaved(new Date());
    },
    [currentPage, updatePage]
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="page-view-loading">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading page…</span>
      </div>
    );
  }

  // ── Not found / archived ───────────────────────────────────────────────────
  if (!currentPage || currentPage.isArchived) {
    return (
      <div className="page-view-not-found">
        <h2>Page not found</h2>
        <p>This page might have been deleted or moved to Trash.</p>
        {onBackToDashboard && (
          <button className="btn-secondary" onClick={onBackToDashboard}>
            Go back
          </button>
        )}
      </div>
    );
  }

  const formattedDate = new Date(currentPage.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Page view ──────────────────────────────────────────────────────────────
  return (
    <div className="page-view-container" style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* ── Main content area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="page-toolbar">
        {/* Left: back + save status */}
        <div className="page-toolbar-left">
          {onBackToDashboard && (
            <button
              className="topbar-icon-btn md-hidden"
              onClick={onBackToDashboard}
              aria-label="Back to home"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className="page-toolbar-date">Edited {formattedDate}</span>
          <EditorSaveStatus isSaving={isSaving} lastSaved={lastSaved} />
        </div>

        {/* Right: page actions */}
        <div className="page-toolbar-right">
          <button
            className={`topbar-icon-btn ${currentPage.isFavorite ? 'active-favorite' : ''}`}
            onClick={() => toggleFavorite(currentPage.id)}
            aria-label={currentPage.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={16}
              style={currentPage.isFavorite ? { fill: 'var(--color-warning)', color: 'var(--color-warning)' } : {}}
            />
          </button>

          <button 
            className="page-toolbar-btn" 
            aria-label="Share page"
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={16} />
            <span className="page-toolbar-btn-label">Share</span>
          </button>

          <button 
            className={`page-toolbar-btn ${isCommentsOpen ? 'active' : ''}`} 
            aria-label="Comments"
            onClick={toggleComments}
            style={isCommentsOpen ? { color: 'var(--color-accent)' } : {}}
          >
            <MessageSquare size={16} />
            <span className="page-toolbar-btn-label">Comments</span>
          </button>

          <button className="page-toolbar-btn page-toolbar-ai" aria-label="Ask AI">
            <Sparkles size={16} />
            <span className="page-toolbar-btn-label">AI</span>
          </button>

          <button className="topbar-icon-btn" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="page-content-scroll">
        {/* Page header: cover, icon, title */}
        <PageHeader page={currentPage} />

        {/* Rich text editor */}
        <div className="page-editor-wrapper">
          <Suspense
            fallback={
              <div className="editor-loading">
                <Loader2 size={18} className="animate-spin" />
                <span>Loading editor…</span>
              </div>
            }
          >
            <Editor
              key={currentPage.id}
              initialContent={currentPage.content}
              onSave={handleSaveContent}
              onSavingStateChange={setIsSaving}
            />
          </Suspense>
        </div>
      </div>
    </div>

      {/* ── Comments Sidebar ─────────────────────────────────────────────── */}
      {isCommentsOpen && (
        <CommentList pageId={currentPage.id} />
      )}
    </div>
  );
}
