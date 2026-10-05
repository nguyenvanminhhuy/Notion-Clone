'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '../../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional context label for error logging (e.g. "PageView", "Sidebar") */
  context?: string;
}

interface State {
  hasError: boolean;
  /** A safe, user-facing error message — no raw stack traces */
  safeMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    safeMessage: null,
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      safeMessage: 'Something went wrong in this section of the app.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const ctx = this.props.context ?? 'ErrorBoundary';
    // Log with context, but never render stack to the user
    logError(ctx, error);

    // In development, also log component stack for easier debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${ctx}] componentStack:`, errorInfo.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, safeMessage: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <AlertTriangle size={28} />
            </div>

            <h2 className="error-boundary-title">Something went wrong</h2>

            <p className="error-boundary-message">
              {this.state.safeMessage ??
                'An unexpected error occurred. Try refreshing the page.'}
            </p>

            <div className="error-boundary-actions">
              <button onClick={this.handleReset} className="error-boundary-btn primary">
                <RefreshCw size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Try again
              </button>

              <button onClick={this.handleReload} className="error-boundary-btn secondary">
                <Home size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
