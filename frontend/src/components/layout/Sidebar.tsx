'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, Settings, Trash2 } from 'lucide-react';
import { WorkspaceSwitcher } from '../../features/workspace/WorkspaceSwitcher';
import { PageTree } from '../../features/page/PageTree';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { useUIStore } from '../../stores/uiStore';
import { TrashModal } from '../shared/TrashModal';
import type { Page } from '../../types/page';

interface SidebarProps {
  selectedPageId?: string | null;
  onPageSelect?: (page: Page) => void;
}

export function Sidebar({ selectedPageId, onPageSelect }: SidebarProps) {
  const router = useRouter();
  const { isOpen } = useSidebarStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { pages, createPage } = usePageStore();
  const { setSearchOpen } = useUIStore();
  const [trashOpen, setTrashOpen] = useState(false);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const favoritePages = useMemo(
    () => pages.filter((p) => p.workspaceId === currentWorkspaceId && p.isFavorite && !p.isArchived),
    [pages, currentWorkspaceId]
  );

  const recentPages = useMemo(
    () =>
      [...pages]
        .filter((p) => p.workspaceId === currentWorkspaceId && !p.isArchived && p.lastOpenedAt)
        .sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))
        .slice(0, 5),
    [pages, currentWorkspaceId]
  );

  const handleAddPage = async () => {
    if (currentWorkspaceId) {
      try {
        const page = await createPage(currentWorkspaceId);
        router.push(`/page/${page.id}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <motion.aside
      className="sidebar"
      initial={false}
      animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
      aria-label="Sidebar navigation"
    >
      <div className="sidebar-inner">
        {/* Workspace switcher */}
        <div className="sidebar-workspace">
          <WorkspaceSwitcher />
        </div>

        {/* Search */}
        <button
          className="sidebar-search-btn"
          aria-label="Search pages (Ctrl+K)"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={15} />
          <span>Search</span>
          <kbd className="sidebar-kbd">⌘K</kbd>
        </button>

        {/* Home */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link href="/" className="sidebar-nav-item">
            <Search size={16} style={{ opacity: 0 }} />
            <span style={{ marginLeft: '-24px' }}>
              <Link href="/" className="sidebar-nav-item" style={{ display: 'contents' }}>
                Home
              </Link>
            </span>
          </Link>
        </nav>

        {/* Favorites */}
        {favoritePages.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <Star size={13} style={{ opacity: 0.6 }} />
              <span>Favorites</span>
            </div>
            {favoritePages.map((page) => (
              <SidebarPageLink
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                onClick={() => {
                  onPageSelect?.(page);
                  router.push(`/page/${page.id}`);
                }}
              />
            ))}
          </div>
        )}

        {/* Recent */}
        {recentPages.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <Clock size={13} style={{ opacity: 0.6 }} />
              <span>Recent</span>
            </div>
            {recentPages.map((page) => (
              <SidebarPageLink
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                onClick={() => {
                  onPageSelect?.(page);
                  router.push(`/page/${page.id}`);
                }}
              />
            ))}
          </div>
        )}

        <div className="sidebar-divider" role="separator" />

        {/* Pages tree */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Pages</span>
            <button
              className="sidebar-section-add"
              aria-label="Add new page"
              onClick={handleAddPage}
            >
              <span>+</span>
            </button>
          </div>
          <PageTree
            workspaceId={currentWorkspaceId}
            selectedPageId={selectedPageId}
            onPageSelect={onPageSelect}
          />
        </div>

        <div className="sidebar-divider" role="separator" />

        {/* Bottom nav */}
        <nav className="sidebar-nav sidebar-nav-secondary" aria-label="Secondary navigation">
          <button
            className="sidebar-nav-item"
            onClick={() => setTrashOpen(true)}
            aria-label="Open Trash"
          >
            <Trash2 size={16} />
            <span>Trash</span>
          </button>
          <Link href="/settings" className="sidebar-nav-item">
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      <TrashModal isOpen={trashOpen} onClose={() => setTrashOpen(false)} />
    </motion.aside>
  );
}

// ── Compact page link in Favorites / Recent lists ─────────────────────────────
function SidebarPageLink({
  page,
  isSelected,
  onClick,
}: {
  page: Page;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left' }}
    >
      <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>
        {page.icon || '📄'}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {page.title || 'Untitled'}
      </span>
    </button>
  );
}

// ── Mobile sidebar (drawer) ───────────────────────────────────────────────────
interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose, ...props }: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Sidebar {...props} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
