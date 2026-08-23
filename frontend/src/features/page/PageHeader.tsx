'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { File, Smile, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Page } from '../../types/page';

interface PageHeaderProps {
  page: Page;
}

const COMMON_EMOJIS = ['📝', '📁', '🎨', '⚛️', '▲', '🔧', '🎯', '💡', '🏠', '🚀', '⭐', '💻', '💼', '📅', '🔑'];

const COVERS = [
  'linear-gradient(to right, #ff9966, #ff5e62)',
  'linear-gradient(to right, #00c6ff, #0072ff)',
  'linear-gradient(to right, #11998e, #38ef7d)',
  'linear-gradient(to right, #7f00ff, #e100ff)',
  'linear-gradient(to right, #3a7bd5, #3a6073)',
  'linear-gradient(to right, #f12711, #f5af19)',
];

export function PageHeader({ page }: PageHeaderProps) {
  const { updatePage } = usePageStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [title, setTitle] = useState(page.title);
  
  const emojiRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  // Click outside listener for pickers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (coverRef.current && !coverRef.current.contains(e.target as Node)) {
        setShowCoverPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title !== page.title) {
      updatePage(page.id, { title: title.trim() || 'Untitled' });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    updatePage(page.id, { icon: emoji });
    setShowEmojiPicker(false);
  };

  const handleRemoveEmoji = () => {
    updatePage(page.id, { icon: null });
    setShowEmojiPicker(false);
  };

  const handleSelectCover = (coverUrl: string) => {
    updatePage(page.id, { cover: coverUrl });
    setShowCoverPicker(false);
  };

  const handleRemoveCover = () => {
    updatePage(page.id, { cover: null });
    setShowCoverPicker(false);
  };

  return (
    <div className="page-header-container" style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
      {/* Cover Image Area */}
      <div
        className="page-cover-wrapper"
        style={{
          height: page.cover ? '160px' : '60px',
          background: page.cover || 'transparent',
          position: 'relative',
          transition: 'height 0.2s ease',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '12px 40px',
        }}
      >
        {page.cover && (
          <div className="cover-actions" style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
            <button
              onClick={() => setShowCoverPicker(true)}
              style={coverBtnStyle}
            >
              Change Cover
            </button>
            <button
              onClick={handleRemoveCover}
              style={coverBtnStyle}
            >
              Remove
            </button>
          </div>
        )}

        {!page.cover && (
          <div className="hover-add-cover" style={{ opacity: 0.7, fontSize: '13px', display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setShowCoverPicker(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}
            >
              <ImageIcon size={14} />
              <span>Add Cover</span>
            </button>
          </div>
        )}

        {/* Cover Picker Dropdown */}
        <AnimatePresence>
          {showCoverPicker && (
            <motion.div
              ref={coverRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="cover-picker-dropdown"
              style={{
                position: 'absolute',
                right: '40px',
                top: '100%',
                zIndex: 200,
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)',
                width: '280px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gallery</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {COVERS.map((cov, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectCover(cov)}
                    style={{
                      height: '48px',
                      borderRadius: '4px',
                      background: cov,
                      border: '1px solid var(--color-border)'
                    }}
                    aria-label={`Select gradient cover ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Header Container (Icon + Title) */}
      <div className="page-header-content" style={{ padding: '0 54px', marginTop: '-30px', position: 'relative' }}>
        {/* Icon Area */}
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '8px' }}>
          {page.icon ? (
            <button
              onClick={() => setShowEmojiPicker(true)}
              style={{
                fontSize: '64px',
                lineHeight: 1,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                display: 'block'
              }}
            >
              {page.icon}
            </button>
          ) : (
            <button
              className="add-icon-btn"
              onClick={() => setShowEmojiPicker(true)}
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px dashed var(--color-border)',
                cursor: 'pointer'
              }}
            >
              <Smile size={16} />
              <span>Add Icon</span>
            </button>
          )}

          {/* Emoji Picker Dropdown */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="emoji-picker"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  zIndex: 200,
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  width: '220px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      style={{ fontSize: '20px', padding: '4px', borderRadius: '4px', transition: 'background-color 0.1s' }}
                      className="hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {page.icon && (
                  <button
                    onClick={handleRemoveEmoji}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-danger)',
                      fontSize: '12px',
                      fontWeight: 600,
                      width: '100%',
                      padding: '6px',
                      borderTop: '1px solid var(--color-border-light)',
                      marginTop: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Remove Icon</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title Input */}
        <input
          type="text"
          className="page-title-input"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          style={{
            display: 'block',
            width: '100%',
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
            letterSpacing: '-0.02em',
          }}
        />
      </div>
    </div>
  );
}

const coverBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
};
