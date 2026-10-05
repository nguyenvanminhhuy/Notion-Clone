'use client';

import { useRouter } from 'next/navigation';
import { FileText, Zap, Star, Clock, Plus, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePageStore } from '../../stores/pageStore';
import { EmptyWorkspace } from './EmptyWorkspace';
import type { Page } from '../../types/page';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getRecentPages(pages: Page[], workspaceId: string | null): Page[] {
  return pages
    .filter((p) => (!workspaceId || p.workspaceId === workspaceId) && !p.isArchived)
    .sort((a, b) => new Date(b.lastOpenedAt ?? b.updatedAt).getTime() - new Date(a.lastOpenedAt ?? a.updatedAt).getTime())
    .slice(0, 5);
}

function getFavoritePages(pages: Page[], workspaceId: string | null): Page[] {
  return pages
    .filter((p) => (!workspaceId || p.workspaceId === workspaceId) && !p.isArchived && p.isFavorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
}

const QUICK_ACTIONS = [
  {
    id: 'new-page',
    label: 'New Page',
    description: 'Start from scratch',
    icon: FileText,
  },
  {
    id: 'ai-write',
    label: 'Write with AI',
    description: 'Let AI help you',
    icon: Zap,
  },
  {
    id: 'template',
    label: 'Use Template',
    description: 'Pick a template',
    icon: BookOpen,
  },
  {
    id: 'import',
    label: 'Import',
    description: 'Bring your content',
    icon: Plus,
  },
];

export function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { pages, createPage } = usePageStore();

  const workspacePages = pages.filter((p) => !p.isArchived);
  if (workspacePages.length === 0) {
    return <EmptyWorkspace />;
  }

  const recentPages = getRecentPages(workspacePages, currentWorkspaceId);
  const favoritePages = getFavoritePages(workspacePages, currentWorkspaceId);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleQuickAction = async (id: string) => {
    if (id === 'new-page' && currentWorkspaceId) {
      const page = await createPage(currentWorkspaceId, null);
      if (page) router.push(`/page/${page.id}`);
    }
  };

  return (
    <div className="home-page">
      {/* Greeting */}
      <h1 className="home-greeting">
        {greeting}, {firstName} 👋
      </h1>
      <p className="home-subtitle">
        Here&apos;s what&apos;s happening in your workspace today.
      </p>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="home-section-title">
          Quick actions
        </h2>
        <div className="home-quick-actions">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className="quick-action-card"
                aria-label={action.label}
                onClick={() => handleQuickAction(action.id)}
              >
                <span className="quick-action-icon">
                  <Icon size={18} />
                </span>
                <span style={{ fontWeight: 500 }}>{action.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Pages */}
      {recentPages.length > 0 && (
        <section aria-labelledby="recent-title" style={{ marginBottom: '32px' }}>
          <h2 id="recent-title" className="home-section-title">
            <Clock size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Recently visited
          </h2>
          <div className="home-recent-list">
            {recentPages.map((page) => (
              <div
                key={page.id}
                className="recent-item"
                role="link"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/page/${page.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/page/${page.id}`)}
              >
                <span className="recent-item-icon">{page.icon ?? '📄'}</span>
                <span className="recent-item-title">{page.title}</span>
                <span className="recent-item-time">
                  {formatRelativeTime(page.lastOpenedAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favoritePages.length > 0 && (
        <section aria-labelledby="favorites-title">
          <h2 id="favorites-title" className="home-section-title">
            <Star size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Favorites
          </h2>
          <div className="home-recent-list">
            {favoritePages.map((page) => (
              <div
                key={page.id}
                className="recent-item"
                role="link"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/page/${page.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/page/${page.id}`)}
              >
                <span className="recent-item-icon">{page.icon ?? '📄'}</span>
                <span className="recent-item-title">{page.title}</span>
                <span className="recent-item-time">
                  {formatRelativeTime(page.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
