'use client';

import { Sidebar, MobileSidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '../../stores/uiStore';
import { usePageStore } from '../../stores/pageStore';
import { useRouter } from 'next/navigation';
import type { Page } from '../../types/page';

import { ToastContainer } from '../shared/Toast';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { selectedPageId, selectPage } = usePageStore();

  const handlePageSelect = (page: Page) => {
    selectPage(page.id);
    setMobileSidebarOpen(false);
    router.push(`/page/${page.id}`);
  };

  return (
    <div className="app-shell">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Desktop sidebar */}
      <div className="sidebar-wrapper desktop-sidebar-only">
        <Sidebar
          selectedPageId={selectedPageId}
          onPageSelect={handlePageSelect}
        />
      </div>

      {/* Mobile sidebar (drawer) */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        selectedPageId={selectedPageId}
        onPageSelect={handlePageSelect}
      />

      {/* Main area */}
      <div className="main-wrapper">
        <TopBar />
        <main className="main-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
