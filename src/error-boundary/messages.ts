import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The default fallback's wording, in each Bloom language. `title`, `message`
 * and `retryLabel` props still win over these.
 */
export interface ErrorBoundaryMessages {
  title: string;
  message: string;
  retry: string;
  /** The `AppErrorFallback` button that copies the error report. */
  copyDetails: string;
  /** What an `AppErrorFallback` says once `maxRetries` is spent. */
  exhausted: string;
}

export const ERROR_BOUNDARY_MESSAGES: MessageCatalog<ErrorBoundaryMessages> =
  defineMessages<ErrorBoundaryMessages>('ERROR_BOUNDARY_MESSAGES', {
    title: 'Something went wrong',
    message: 'An unexpected error occurred',
    retry: 'Try Again',
    copyDetails: 'Copy error details',
    exhausted: 'This keeps failing. Close and reopen the app.',
  });
