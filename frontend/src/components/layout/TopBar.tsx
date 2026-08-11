'use client';

import { Search, Bell, Moon, Sun, Monitor, PanelLeft } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { MOCK_CURRENT_USER } from '../../mock/users';

export function TopBar() {
  const { theme, setTheme, toggleMobileSidebar } = useUIStore();
  const { toggleSidebar, isOpen } = useSidebarStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon =
    theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const initials = MOCK_CURRENT_USER.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      {/* Left: sidebar toggle + breadcrumb */}
      <div className="topbar-left">
        <button
          className="topbar-icon-btn hidden md:flex"
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={18} />
        </button>
        <button
          className="topbar-icon-btn flex md:hidden"
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
        >
          <PanelLeft size={18} />
        </button>
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-item">Personal</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item active">Home</span>
        </nav>
      </div>

      {/* Right: actions */}
      <div className="topbar-right">
        <button
          className="topbar-search-btn"
          aria-label="Search (Ctrl+K)"
          onClick={() => useUIStore.getState().setSearchOpen(true)}
        >
          <Search size={15} />
          <span>Search</span>
          <kbd className="topbar-kbd">⌘K</kbd>
        </button>

        <button
          className="topbar-icon-btn"
          onClick={cycleTheme}
          aria-label={`Theme: ${theme}`}
        >
          <ThemeIcon size={18} />
        </button>

        <button className="topbar-icon-btn relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge" aria-label="3 unread notifications">
            3
          </span>
        </button>

        <button className="topbar-avatar" aria-label="User menu">
          {initials}
        </button>
      </div>
    </header>
  );
}
