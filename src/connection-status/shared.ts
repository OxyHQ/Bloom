import { useEffect, useRef } from 'react';

import { toast } from '../toast';

/** One id for the whole lifecycle, so the toast updates in place. */
const TOAST_ID = 'bloom-connection-status';

export interface ConnectionStatusToastsProps {
  /** Shown as soon as the device reports no connection. */
  offlineMessage?: string;
  /** Replaces `offlineMessage` once the outage has lasted `reconnectingDelayMs`. */
  reconnectingMessage?: string;
  /** Shown briefly when the connection comes back. */
  restoredMessage?: string;
  /** How long an outage must last before it reads as "reconnecting". */
  reconnectingDelayMs?: number;
  /** How long the restored toast stays up. */
  restoredDurationMs?: number;
}

const DEFAULTS = {
  offlineMessage: 'No internet connection',
  reconnectingMessage: 'Reconnecting…',
  restoredMessage: 'Back online',
  reconnectingDelayMs: 3000,
  restoredDurationMs: 2500,
} as const;

/**
 * Drive the connection toast from an `isOnline` signal.
 *
 * Platform-agnostic half of `ConnectionStatusToasts`: the forks differ only in
 * where the signal comes from (NetInfo on native, `navigator.onLine` on web),
 * never in what the user sees.
 *
 * `isOnline === null` means "not determined yet" and shows nothing — a first
 * paint must not accuse the user of being offline.
 */
export function useConnectionStatusToasts(
  isOnline: boolean | null,
  {
    offlineMessage = DEFAULTS.offlineMessage,
    reconnectingMessage = DEFAULTS.reconnectingMessage,
    restoredMessage = DEFAULTS.restoredMessage,
    reconnectingDelayMs = DEFAULTS.reconnectingDelayMs,
    restoredDurationMs = DEFAULTS.restoredDurationMs,
  }: ConnectionStatusToastsProps = {},
): void {
  // Whether an outage toast is currently up, so coming back online only
  // announces itself to someone who saw the outage.
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOnline === null) return undefined;

    if (!isOnline) {
      wasOffline.current = true;
      // Persistent: an outage ends when the network says so, not on a timer.
      toast.error(offlineMessage, { id: TOAST_ID, duration: Infinity, dismissible: false });
      const escalate = setTimeout(() => {
        toast.warning(reconnectingMessage, {
          id: TOAST_ID,
          duration: Infinity,
          dismissible: false,
        });
      }, reconnectingDelayMs);
      return () => clearTimeout(escalate);
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success(restoredMessage, { id: TOAST_ID, duration: restoredDurationMs });
    }
    return undefined;
  }, [
    isOnline,
    offlineMessage,
    reconnectingMessage,
    restoredMessage,
    reconnectingDelayMs,
    restoredDurationMs,
  ]);
}
