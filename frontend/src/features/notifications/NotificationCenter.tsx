'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, AtSign, Share2, Info, Check, CheckCheck } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import type { NotificationType, Notification } from '../../types/notification';
import { useRouter } from 'next/navigation';

export function NotificationCenter() {
  const { isNotificationsOpen, setNotificationsOpen } = useUIStore();
  const { notifications, loadNotifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Assuming user-1 for mock
    loadNotifications('user-1');
  }, [loadNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isNotificationsOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Checking if click is not on the bell button (which is handled separately in Topbar)
        const target = e.target as HTMLElement;
        if (!target.closest('.notification-bell-btn')) {
           setNotificationsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isNotificationsOpen, setNotificationsOpen]);

  const unreadCount = getUnreadCount();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'comment': return <MessageSquare size={14} style={{ color: 'var(--color-accent)' }} />;
      case 'mention': return <AtSign size={14} style={{ color: 'var(--color-warning)' }} />;
      case 'share': return <Share2 size={14} style={{ color: 'var(--color-success)' }} />;
      case 'system': return <Info size={14} style={{ color: 'var(--color-text-secondary)' }} />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setNotificationsOpen(false);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <AnimatePresence>
      {isNotificationsOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="notification-panel"
          style={{
            position: 'absolute',
            top: '44px',
            right: '16px',
            width: '320px',
            maxHeight: '400px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={14} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Updates</span>
              {unreadCount > 0 && (
                <span style={{ background: 'var(--color-danger)', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead('user-1')}
                style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                You're all caught up!
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--color-border-light)', 
                    display: 'flex', 
                    gap: '12px',
                    cursor: notification.link ? 'pointer' : 'default',
                    background: notification.read ? 'transparent' : 'var(--color-bg-hover)',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{notification.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatTimeAgo(notification.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
