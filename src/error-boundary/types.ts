import type { ReactNode, ErrorInfo } from 'react';

/**
 * Context passed to a render-prop `fallback` when an ErrorBoundary catches an
 * error. Consumers can use this to render rich fallback UI (stack traces,
 * report buttons, retry counters, i18n strings, etc).
 */
export interface ErrorBoundaryFallbackContext {
  /** The error thrown by a descendant during render/commit. */
  error: Error;
  /**
   * The React-supplied error info (`componentStack`). May be `null` if
   * `componentDidCatch` has not run yet for the current crash — in practice it
   * is populated before the fallback is shown.
   */
  errorInfo: ErrorInfo | null;
  /**
   * Resets the boundary back to its non-error state and re-renders `children`.
   * Increments {@link retryCount} as a side effect.
   */
  retry: () => void;
  /**
   * Number of times {@link retry} has been invoked for the currently-mounted
   * boundary instance. Starts at 0; increments by 1 on each `retry()` call.
   * Useful for showing "Try again (n/max)" UIs and giving up after N attempts.
   */
  retryCount: number;
}

/**
 * The `fallback` may either be a plain ReactNode (rendered as-is, no error
 * context) or a render function that receives the error context and returns
 * a ReactNode.
 */
export type ErrorBoundaryFallback =
  | ReactNode
  | ((context: ErrorBoundaryFallbackContext) => ReactNode);

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Custom fallback UI to render on error. Accepts either:
   *  - a ReactNode (static — same UI on every error), or
   *  - a render-prop `(ctx) => ReactNode` receiving `{ error, errorInfo,
   *    retry, retryCount }`.
   *
   * Backward-compatible: passing a static node continues to work unchanged.
   */
  fallback?: ErrorBoundaryFallback;
  /** Error title (defaults to "Something went wrong") */
  title?: string;
  /** Error message (defaults to "An unexpected error occurred") */
  message?: string;
  /** Retry button label (defaults to "Try Again") */
  retryLabel?: string;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  testID?: string;
}
