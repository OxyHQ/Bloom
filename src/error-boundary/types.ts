import type { ReactNode, ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to render on error */
  fallback?: ReactNode;
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
