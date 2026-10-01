'use client';

import { useState } from 'react';
import { Search, Bell, Moon, Sun, Monitor, PanelLeft, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { NotificationCenter } from '../../features/notifications/NotificationCenter';
import { AuthModal } from '../../features/auth/AuthModal';

export function TopBar() {
  const { theme, setTheme, toggleMobileSidebar, isNotificationsOpen, setNotificationsOpen } = useUIStore();
  const { toggleSidebar, isOpen } = useSidebarStore();
  const { getUnreadCount } = useNotificationStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const unreadCount = getUnreadCount();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon =
    theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const displayName = user?.name || 'Guest User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

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
      <div className="topbar-right relative">
        <button
          className="topbar-search-btn"
          aria-label="Search (Ctrl+K)"
          onClick={() => useUIStore.getState().setSearchOpen(true)}
        >
          <Search size={15} />
          <span className="topbar-search-text">Search</span>
          <kbd className="topbar-kbd topbar-kbd-desktop">⌘K</kbd>
        </button>

        <button
          className="topbar-icon-btn"
          onClick={cycleTheme}
          aria-label={`Theme: ${theme}`}
        >
          <ThemeIcon size={18} />
        </button>

        <button 
          className={`topbar-icon-btn notification-bell-btn ${isNotificationsOpen ? 'active' : ''}`}
          onClick={() => setNotificationsOpen(!isNotificationsOpen)}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
              {unreadCount}
            </span>
          )}
        </button>
        <NotificationCenter />

        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="topbar-avatar hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
              aria-label="User menu"
            >
              {initials}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors text-left"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
}

