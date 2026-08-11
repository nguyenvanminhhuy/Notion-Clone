'use client';

import { useState } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '../../stores/uiStore';
import type { Page } from '../../types/page';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const handlePageSelect = (page: Page) => {
    setSelectedPageId(page.id);
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <div className="sidebar-wrapper hidden md:flex">
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
