'use client';

import { FileText, Zap, Star, Clock, Plus, BookOpen } from 'lucide-react';
import { MOCK_CURRENT_USER } from '../../mock/users';
import { MOCK_PAGES, getRecentPages, getFavoritePages } from '../../mock/pages';
import { useWorkspaceStore } from '../../stores/workspaceStore';

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
  const { currentWorkspaceId } = useWorkspaceStore();
  const recentPages = getRecentPages(MOCK_PAGES, currentWorkspaceId);
  const favoritePages = getFavoritePages(MOCK_PAGES, currentWorkspaceId);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = MOCK_CURRENT_USER.name.split(' ')[0];

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
              <div key={page.id} className="recent-item" role="link" tabIndex={0}>
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
              <div key={page.id} className="recent-item" role="link" tabIndex={0}>
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
