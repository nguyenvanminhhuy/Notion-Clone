/**
 * Centralized error classification and user-facing message formatting.
 *
 * Rule: Never expose raw stack traces or internal error messages to users.
 * All messages returned here are safe for display in the UI.
 */
import { ApiError } from '../services/api/apiError';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface ClassifiedError {
  /** Safe user-facing message — no stack traces, no internals */
  message: string;
  /** Original status code (0 = network error, undefined = unknown) */
  statusCode?: number;
  /** Whether the user can retry the action */
  retryable: boolean;
  /** Whether the session is invalid (should redirect to login) */
  isAuthError: boolean;
  /** Whether the user lacks permission */
  isForbidden: boolean;
  /** Whether the resource was not found */
  isNotFound: boolean;
  /** Whether we are being rate-limited */
  isRateLimited: boolean;
  /** UI severity level */
  severity: ErrorSeverity;
}

/**
 * Convert any thrown value into a safe, classified error object.
 */
export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof ApiError) {
    return classifyApiError(err);
  }

  if (err instanceof Error) {
    // Network / DNS / CORS errors that aren't wrapped by ApiError
    const msg = err.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return {
        message: 'Could not connect to the server. Check your internet connection and try again.',
        statusCode: 0,
        retryable: true,
        isAuthError: false,
        isForbidden: false,
        isNotFound: false,
        isRateLimited: false,
        severity: 'error',
      };
    }
  }

  // Unknown / unexpected error — don't expose raw message
  return {
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
    isAuthError: false,
    isForbidden: false,
    isNotFound: false,
    isRateLimited: false,
    severity: 'error',
  };
}

function classifyApiError(err: ApiError): ClassifiedError {
  const base: Omit<ClassifiedError, 'message' | 'severity'> = {
    statusCode: err.statusCode,
    retryable: false,
    isAuthError: err.statusCode === 401,
    isForbidden: err.statusCode === 403,
    isNotFound: err.statusCode === 404,
    isRateLimited: err.statusCode === 429,
  };

  if (err.isNetworkError || err.statusCode === 0) {
    return {
      ...base,
      message: 'Could not connect to the server. Check your internet connection and try again.',
      retryable: true,
      severity: 'error',
    };
  }

  switch (err.statusCode) {
    case 400:
      return {
        ...base,
        message: err.errors?.join('. ') || err.message || 'The request was invalid.',
        retryable: false,
        severity: 'warning',
      };
    case 401:
      return {
        ...base,
        message: 'Your session has expired. Please sign in again.',
        retryable: false,
        severity: 'warning',
      };
    case 403:
      return {
        ...base,
        message: "You don't have permission to perform this action.",
        retryable: false,
        severity: 'warning',
      };
    case 404:
      return {
        ...base,
        message: 'The requested resource was not found.',
        retryable: false,
        severity: 'info',
      };
    case 409:
      return {
        ...base,
        message: err.message || 'A conflict occurred. The resource may already exist.',
        retryable: false,
        severity: 'warning',
      };
    case 413:
      return {
        ...base,
        message: 'The file or request is too large.',
        retryable: false,
        severity: 'warning',
      };
    case 415:
      return {
        ...base,
        message: 'This file type is not supported.',
        retryable: false,
        severity: 'warning',
      };
    case 422:
      return {
        ...base,
        message: err.errors?.join('. ') || err.message || 'The submitted data is invalid.',
        retryable: false,
        severity: 'warning',
      };
    case 429:
      return {
        ...base,
        message: 'Too many requests. Please wait a moment before trying again.',
        retryable: true,
        severity: 'warning',
      };
    case 408:
      return {
        ...base,
        message: 'The request timed out. Please try again.',
        retryable: true,
        severity: 'error',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        ...base,
        message: 'The server encountered an error. Please try again in a moment.',
        retryable: true,
        severity: 'error',
      };
    default:
      return {
        ...base,
        message: err.message || 'An unexpected error occurred.',
        retryable: true,
        severity: 'error',
      };
  }
}

/**
 * Extract a safe toast/alert message from any error.
 */
export function getErrorMessage(err: unknown): string {
  return classifyError(err).message;
}

/**
 * Log an error to the console with context prefix.
 * In production this can be swapped for a remote error tracking service.
 */
export function logError(context: string, err: unknown): void {
  // Only log in development; in production hook to Sentry/Datadog etc.
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, err);
  }
  // TODO: send to error tracking service in production
}
