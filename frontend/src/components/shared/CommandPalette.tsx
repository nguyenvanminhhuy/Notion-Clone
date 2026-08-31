'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search, FileText, Plus, Moon, Sun, Trash2, Home,
  CornerDownLeft, Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { searchService, type SearchResult } from '../../services/searchService';
import type { Page } from '../../types/page';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CommandItem {
  kind: 'command';
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface PageItem {
  kind: 'page';
  result: SearchResult;
}

type ListItem = CommandItem | PageItem;

// ── Main Component ────────────────────────────────────────────────────────────
export function CommandPalette() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen, theme, setTheme } = useUIStore();
  const { pages, createPage } = usePageStore();
  const { currentWorkspaceId } = useWorkspaceStore();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Commands ─────────────────────────────────────────────────────────────
  const commands = useMemo<CommandItem[]>(() => [
    {
      kind: 'command',
      id: 'home',
      label: 'Go to Home',
      icon: <Home size={15} />,
      action: () => { router.push('/'); close(); },
    },
    {
      kind: 'command',
      id: 'new-page',
      label: 'Create New Page',
      icon: <Plus size={15} />,
      action: async () => {
        close();
        const p = await createPage(currentWorkspaceId);
        router.push(`/page/${p.id}`);
      },
    },
    {
      kind: 'command',
      id: 'toggle-theme',
      label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      icon: theme === 'light' ? <Moon size={15} /> : <Sun size={15} />,
      action: () => { setTheme(theme === 'light' ? 'dark' : 'light'); close(); },
    },
    {
      kind: 'command',
      id: 'ai',
      label: 'Ask AI Assistant',
      icon: <Sparkles size={15} style={{ color: 'var(--color-accent)' }} />,
      action: () => { useUIStore.getState().setAIPanelOpen(true); close(); },
    },
  ], [theme, currentWorkspaceId]);

  const close = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setSearchResults([]);
    setSelectedIdx(0);
  }, [setSearchOpen]);

  // ── Filtered command list ─────────────────────────────────────────────────
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // ── Combined list for keyboard navigation ─────────────────────────────────
  const allItems = useMemo<ListItem[]>(() => [
    ...searchResults.map<ListItem>((r) => ({ kind: 'page', result: r })),
    ...filteredCommands,
  ], [searchResults, filteredCommands]);

  // ── Global Cmd/Ctrl+K ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchOpen) close(); else setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSearchOpen, close, setSearchOpen]);

  // ── Arrow / Enter / Esc inside open palette ───────────────────────────────
  useEffect(() => {
    if (!isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % Math.max(allItems.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + allItems.length) % Math.max(allItems.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeItem(allItems[selectedIdx]);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isSearchOpen, allItems, selectedIdx, close]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const t = setTimeout(() => {
      searchService.searchPages(query, currentWorkspaceId, pages).then((r) => {
        setSearchResults(r.slice(0, 8));
        setSelectedIdx(0);
        setIsSearching(false);
      });
    }, 150);
    return () => clearTimeout(t);
  }, [query, pages, currentWorkspaceId]);

  // ── Focus & reset on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSearchOpen) {
      setQuery(''); setSearchResults([]); setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // ── Scroll selected into view ─────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const executeItem = (item: ListItem | undefined) => {
    if (!item) return;
    if (item.kind === 'command') { item.action(); return; }
    router.push(`/page/${item.result.page.id}`);
    close();
  };

  const recentPages = useMemo(() => {
    if (query.trim()) return [];
    return [...pages]
      .filter((p) => p.workspaceId === currentWorkspaceId && !p.isArchived && p.lastOpenedAt)
      .sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))
      .slice(0, 5);
  }, [pages, currentWorkspaceId, query]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div
          className="modal-overlay"
          style={{ alignItems: 'flex-start', paddingTop: '12vh' }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          aria-modal="true"
          role="dialog"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.14 }}
            className="modal-panel command-palette-panel"
          >
            {/* Search Input */}
            <div className="command-palette-input-row">
              <Search size={17} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search pages or type a command…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="command-palette-input"
                aria-label="Search"
              />
              {isSearching && (
                <span className="command-palette-spinner" />
              )}
              <kbd className="command-palette-esc">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="command-palette-list">
              {/* Recent (shown when no query) */}
              {!query.trim() && recentPages.length > 0 && (
                <div>
                  <div className="cp-section-header">Recent</div>
                  {recentPages.map((page, idx) => (
                    <PageRow
                      key={page.id}
                      page={page}
                      breadcrumbs={[]}
                      matchType="title"
                      isSelected={idx === selectedIdx}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => { router.push(`/page/${page.id}`); close(); }}
                    />
                  ))}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <div className="cp-section-header">Pages</div>
                  {searchResults.map((result, idx) => (
                    <PageRow
                      key={result.page.id}
                      page={result.page}
                      breadcrumbs={result.breadcrumbs}
                      matchType={result.matchType}
                      snippet={result.snippet}
                      isSelected={idx === selectedIdx}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => executeItem({ kind: 'page', result })}
                    />
                  ))}
                </div>
              )}

              {/* No results */}
              {query.trim() && searchResults.length === 0 && !isSearching && (
                <div className="cp-no-results">No pages matching "{query}"</div>
              )}

              {/* Commands */}
              {filteredCommands.length > 0 && (
                <div>
                  <div className="cp-section-header">Commands</div>
                  {filteredCommands.map((cmd, ci) => {
                    const idx = searchResults.length + ci;
                    return (
                      <div
                        key={cmd.id}
                        className={`cp-item ${idx === selectedIdx ? 'selected' : ''}`}
                        data-selected={idx === selectedIdx}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        onClick={() => executeItem(cmd)}
                        role="option"
                        aria-selected={idx === selectedIdx}
                      >
                        <span className="cp-item-icon">{cmd.icon}</span>
                        <span className="cp-item-label">{cmd.label}</span>
                        {idx === selectedIdx && <CornerDownLeft size={12} className="cp-item-hint" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="command-palette-footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>ESC</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Sub-component for page result rows ────────────────────────────────────────
interface PageRowProps {
  page: Page;
  breadcrumbs: string[];
  matchType: 'title' | 'content';
  snippet?: string;
  isSelected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function PageRow({ page, breadcrumbs, snippet, isSelected, onMouseEnter, onClick }: PageRowProps) {
  return (
    <div
      className={`cp-item ${isSelected ? 'selected' : ''}`}
      data-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
    >
      <span className="cp-page-icon">{page.icon || <FileText size={14} />}</span>
      <div className="cp-item-text">
        <span className="cp-item-label">{page.title || 'Untitled'}</span>
        {breadcrumbs.length > 0 && (
          <span className="cp-item-breadcrumb">{breadcrumbs.join(' › ')}</span>
        )}
        {snippet && <span className="cp-item-snippet">{snippet}</span>}
      </div>
      {isSelected && <CornerDownLeft size={12} className="cp-item-hint" />}
    </div>
  );
}
