'use client';

import React from 'react';
import { AlertTriangle, WifiOff, Lock, FileX, RefreshCw } from 'lucide-react';
import type { ClassifiedError } from '../../lib/errorHandler';

interface InlineErrorProps {
  error: ClassifiedError | string;
  onRetry?: () => void;
  compact?: boolean;
}

export function InlineError({ error, onRetry, compact = false }: InlineErrorProps) {
  const message = typeof error === 'string' ? error : error.message;
  const retryable = typeof error === 'string' ? true : error.retryable;
  const statusCode = typeof error === 'string' ? undefined : error.statusCode;
  const isNetwork = statusCode === 0;
  const isForbidden = statusCode === 403;
  const isNotFound = statusCode === 404;

  const Icon = isNetwork ? WifiOff : isForbidden ? Lock : isNotFound ? FileX : AlertTriangle;

  if (compact) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <AlertTriangle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{message}</span>
        {retryable && onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-accent)',
              fontSize: '12px',
              fontWeight: 500,
              padding: '0 4px',
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} style={{ color: 'var(--color-danger)' }} />
      </div>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          maxWidth: '320px',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      {retryable && onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
