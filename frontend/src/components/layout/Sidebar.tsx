'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { WorkspaceSwitcher } from '../../features/workspace/WorkspaceSwitcher';
import { PageTree } from '../../features/page/PageTree';
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../config/navigation';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import type { Page } from '../../types/page';

interface SidebarProps {
  selectedPageId?: string | null;
  onPageSelect?: (page: Page) => void;
}

export function Sidebar({ selectedPageId, onPageSelect }: SidebarProps) {
  const { isOpen } = useSidebarStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { createPage } = usePageStore();
  const [activeNav, setActiveNav] = useState('home');

  const handleAddPage = async () => {
    if (currentWorkspaceId) {
      try {
        await createPage(currentWorkspaceId);
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
          aria-label="Search pages"
        >
          <Search size={15} />
          <span>Search</span>
          <kbd className="sidebar-kbd">⌘K</kbd>
        </button>

        {/* Primary nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`sidebar-nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
                aria-current={activeNav === item.id ? 'page' : undefined}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-divider" role="separator" />

        {/* Pages section */}
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

        {/* Secondary nav (Trash, Settings) */}
        <nav className="sidebar-nav sidebar-nav-secondary" aria-label="Secondary navigation">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="sidebar-nav-item"
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}

// Mobile sidebar (drawer)
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
