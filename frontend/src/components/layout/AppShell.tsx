'use client';

import { useEffect } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '../../stores/uiStore';
import { usePageStore } from '../../stores/pageStore';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useRouter } from 'next/navigation';
import type { Page } from '../../types/page';
import { logError } from '../../lib/errorHandler';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ToastContainer } from '../shared/Toast';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { selectedPageId, selectPage } = usePageStore();
  const { initializeAuth, isAuthenticated } = useAuthStore();
  const { loadWorkspaces } = useWorkspaceStore();

  // Initialize auth + workspaces on mount
  useEffect(() => {
    initializeAuth().then(() => {
      loadWorkspaces();
    });
  }, [initializeAuth, loadWorkspaces]);

  // Global unhandled promise rejection guard
  // Prevents "Unhandled promise rejection" from crashing or silently failing
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the default browser console noise
      event.preventDefault();
      logError('UnhandledRejection', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const handlePageSelect = (page: Page) => {
    selectPage(page.id);
    setMobileSidebarOpen(false);
    router.push(`/page/${page.id}`);
  };

  return (
    <div className="app-shell">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Desktop sidebar — wrapped in its own error boundary so a sidebar crash doesn't blank the whole app */}
      <ErrorBoundary context="Sidebar" fallback={<div className="sidebar-wrapper desktop-sidebar-only" style={{ width: '240px' }} />}>
        <div className="sidebar-wrapper desktop-sidebar-only">
          <Sidebar
            selectedPageId={selectedPageId}
            onPageSelect={handlePageSelect}
          />
        </div>
      </ErrorBoundary>

      {/* Mobile sidebar (drawer) */}
      <ErrorBoundary context="MobileSidebar">
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          selectedPageId={selectedPageId}
          onPageSelect={handlePageSelect}
        />
      </ErrorBoundary>

      {/* Main area */}
      <div className="main-wrapper">
        <ErrorBoundary context="TopBar">
          <TopBar />
        </ErrorBoundary>
        <main className="main-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
