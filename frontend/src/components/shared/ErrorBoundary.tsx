'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
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
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="error-boundary-title">Something went wrong</h2>

            <p className="error-boundary-message">
              {this.state.error?.message || 'An unexpected error occurred in the application.'}
            </p>

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-btn primary"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Try again
              </button>

              <button
                onClick={this.handleReload}
                className="error-boundary-btn secondary"
              >
                <Home className="w-4 h-4 inline mr-1" />
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
