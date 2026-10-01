'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, X, Link as LinkIcon, Mail, Check, Trash2, Shield, Loader2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';
import { usePageStore } from '../../stores/pageStore';
import { shareService } from '../../services/shareService';
import type { PageShare, PageRole } from '../../types/page';

export function ShareDialog() {
  const { isShareOpen, setShareOpen } = useUIStore();
  const { addToast } = useToastStore();
  const { selectedPageId, pages, updatePage } = usePageStore();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<PageRole>('editor');
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<PageShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const page = pages.find((p) => p.id === selectedPageId);

  useEffect(() => {
    if (isShareOpen && selectedPageId) {
      setIsLoadingShares(true);
      shareService
        .getPageShares(selectedPageId)
        .then(setShares)
        .catch((err) => console.error('Failed to load page shares:', err))
        .finally(() => setIsLoadingShares(false));
    }
  }, [isShareOpen, selectedPageId]);

  // Esc to close
  useEffect(() => {
    if (!isShareOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShareOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareOpen, setShareOpen]);

  const handleCopyLink = () => {
    if (!selectedPageId) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/page/${selectedPageId}` : '';
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast({ message: 'Link copied to clipboard', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedPageId) return;

    setIsSubmitting(true);
    try {
      const newShare = await shareService.sharePage(selectedPageId, inviteEmail.trim(), inviteRole);
      setShares((prev) => [...prev, newShare]);
      addToast({ message: `Access granted to ${inviteEmail}`, type: 'success' });
      setInviteEmail('');
    } catch (err) {
      console.error(err);
      addToast({ message: 'Failed to share page', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!selectedPageId) return;
    try {
      await shareService.togglePublicAccess(selectedPageId, isPublic);
      await updatePage(selectedPageId, { isPublic });
      addToast({
        message: isPublic ? 'Public web access enabled' : 'Public web access disabled',
        type: 'info',
      });
    } catch (err) {
      console.error(err);
      addToast({ message: 'Failed to update public access', type: 'error' });
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await shareService.removeShare(shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      addToast({ message: 'Permission revoked', type: 'info' });
    } catch (err) {
      console.error(err);
      addToast({ message: 'Failed to revoke permission', type: 'error' });
    }
  };

  if (!page) return null;

  return (
    <AnimatePresence>
      {isShareOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareOpen(false);
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Share Page"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="modal-panel"
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: '15px' }}>
                Share &quot;{page.title || 'Untitled'}&quot;
              </span>
              <button
                className="topbar-icon-btn"
                onClick={() => setShareOpen(false)}
                aria-label="Close share dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              {/* Invite row */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Mail
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '10px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Add people by email..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as PageRole)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="viewer">Can View</option>
                    <option value="editor">Can Edit</option>
                  </select>

                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={!inviteEmail || isSubmitting}
                    style={{
                      background: inviteEmail ? 'var(--color-accent)' : '',
                      color: inviteEmail ? '#fff' : '',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : 'Invite'}
                  </button>
                </form>
              </div>

              {/* Public access toggle */}
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => handleTogglePublic(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: !page.isPublic ? 'var(--color-bg-hover)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Restricted
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Only invited workspace members and shared emails
                    </div>
                  </div>
                  {!page.isPublic && <Check size={16} style={{ color: 'var(--color-accent)' }} />}
                </button>

                <button
                  onClick={() => handleTogglePublic(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: page.isPublic ? 'var(--color-bg-hover)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Globe size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Share to Web
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Anyone with the link can view this page
                    </div>
                  </div>
                  {page.isPublic && <Check size={16} style={{ color: 'var(--color-accent)' }} />}
                </button>
              </div>

              {/* Shared people list */}
              {shares.length > 0 && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border-light)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                    Shared with
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {shares.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                        <span style={{ color: 'var(--color-text-primary)' }}>{s.email || 'Workspace Member'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{s.role}</span>
                          <button
                            onClick={() => handleRemoveShare(s.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }}
                            title="Revoke access"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-bg-secondary)',
                  borderBottomLeftRadius: 'var(--radius-xl)',
                  borderBottomRightRadius: 'var(--radius-xl)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {page.isPublic ? 'Publicly accessible' : 'Private to workspace'}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {copied ? <Check size={14} /> : <LinkIcon size={14} />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
