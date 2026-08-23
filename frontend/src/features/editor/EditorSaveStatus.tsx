'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface EditorSaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function EditorSaveStatus({ isSaving, lastSaved }: EditorSaveStatusProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isSaving || lastSaved) {
      setShow(true);
      if (!isSaving) {
        const timer = setTimeout(() => setShow(false), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [isSaving, lastSaved]);

  if (!show) return null;

  return (
    <span
      style={{
        fontSize: '12px',
        color: isSaving ? 'var(--color-text-tertiary)' : 'var(--color-success)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'color 0.2s',
        userSelect: 'none',
      }}
      aria-live="polite"
      aria-label={isSaving ? 'Saving...' : 'Saved'}
    >
      {isSaving ? (
        <>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-tertiary)',
              animation: 'pulse 1.2s ease-in-out infinite',
              display: 'inline-block',
            }}
          />
          Saving…
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Saved
        </>
      )}
    </span>
  );
}
