'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, X, Link, Mail, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';
import { usePageStore } from '../../stores/pageStore';

export function ShareDialog() {
  const { isShareOpen, setShareOpen } = useUIStore();
  const { addToast } = useToastStore();
  const { selectedPageId, pages } = usePageStore();
  
  const [shareType, setShareType] = useState<'private' | 'public'>('private');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const page = pages.find((p) => p.id === selectedPageId);

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
    navigator.clipboard.writeText(`https://notionclone.app/page/${selectedPageId}`);
    setCopied(true);
    addToast({ message: 'Link copied to clipboard', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      addToast({ message: `Invitation sent to ${inviteEmail}`, type: 'success' });
      setInviteEmail('');
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
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: '15px' }}>Share '{page.title || 'Untitled'}'</span>
              <button
                className="topbar-icon-btn"
                onClick={() => setShareOpen(false)}
                aria-label="Close share dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--color-text-tertiary)' }} />
                    <input 
                      type="email" 
                      placeholder="Add people, groups, or emails..."
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
                  <button type="submit" className="btn-secondary" disabled={!inviteEmail} style={{ background: inviteEmail ? 'var(--color-accent)' : '', color: inviteEmail ? '#fff' : '' }}>
                    Invite
                  </button>
                </form>
              </div>

              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => setShareType('private')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: shareType === 'private' ? 'var(--color-bg-hover)' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                    <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Restricted</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Only people invited to this workspace can access</div>
                  </div>
                  {shareType === 'private' && <Check size={16} style={{ color: 'var(--color-accent)' }} />}
                </button>

                <button 
                  onClick={() => setShareType('public')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: shareType === 'public' ? 'var(--color-bg-hover)' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                    <Globe size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Anyone with link</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Anyone on the internet with the link can view</div>
                  </div>
                  {shareType === 'public' && <Check size={16} style={{ color: 'var(--color-accent)' }} />}
                </button>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Mock sharing interface</span>
                <button 
                  onClick={handleCopyLink}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  {copied ? <Check size={14} /> : <Link size={14} />}
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
