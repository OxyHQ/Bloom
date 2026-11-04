import { useSyncExternalStore } from 'react';

/**
 * The connection as Bloom's components read it, shared by both forks of
 * `useNetworkStatus`: one subscription to the platform's source however many
 * components ask, started by the first and stopped by the last.
 */

/** What the device's connection allows right now. */
export interface NetworkStatus {
  /**
   * Whether the device is online. Native: the link is up and the internet is not
   * known to be unreachable (netinfo's probe). Web: `navigator.onLine`, which
   * knows the link and not reachability.
   */
  online: boolean;
  /**
   * Whether data costs the viewer: a cellular connection, or one the platform
   * marks expensive (netinfo's `isConnectionExpensive`; the browser's Save-Data).
   */
  metered: boolean;
}

/**
 * Until the platform answers, and wherever it cannot (no netinfo peer, a browser
 * without the Network Information API): online and unmetered. Nothing is held
 * back and no outage is announced on a guess.
 */
export const UNKNOWN_NETWORK_STATUS: NetworkStatus = Object.freeze({
  online: true,
  metered: false,
});

/** Starts watching the platform, publishing every reading; returns how to stop. */
export type NetworkStatusSource = (
  publish: (status: NetworkStatus) => void,
) => (() => void) | undefined;

/** A `useSyncExternalStore` store over one shared subscription to `source`. */
export function createNetworkStatusStore(source: NetworkStatusSource) {
  let snapshot = UNKNOWN_NETWORK_STATUS;
  let stop: (() => void) | undefined;
  const listeners = new Set<() => void>();

  const publish = (next: NetworkStatus) => {
    if (next.online === snapshot.online && next.metered === snapshot.metered) return;
    snapshot = { online: next.online, metered: next.metered };
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      if (listeners.size === 1) stop = source(publish);
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        stop?.();
        stop = undefined;
        // Nobody is watching, so the last reading would go stale; the next
        // subscriber starts from the platform's fresh answer.
        snapshot = UNKNOWN_NETWORK_STATUS;
      };
    },
    getSnapshot: (): NetworkStatus => snapshot,
    getServerSnapshot: (): NetworkStatus => UNKNOWN_NETWORK_STATUS,
  };
}

/** {@link useNetworkStatus}'s options. */
export interface UseNetworkStatusOptions {
  /**
   * Whether to watch the connection at all. Default `true`. `false` starts no
   * subscription and reads {@link UNKNOWN_NETWORK_STATUS}, so a caller that only
   * sometimes needs the answer (media autoplay outside "Wi-Fi only") costs the
   * platform nothing.
   */
  enabled?: boolean;
}

const subscribeNothing = (): (() => void) => () => {};
const readUnknown = (): NetworkStatus => UNKNOWN_NETWORK_STATUS;

/** The hook body both forks share: the store when enabled, nothing when not. */
export function useNetworkStatusFrom(
  store: ReturnType<typeof createNetworkStatusStore>,
  { enabled = true }: UseNetworkStatusOptions = {},
): NetworkStatus {
  return useSyncExternalStore(
    enabled ? store.subscribe : subscribeNothing,
    enabled ? store.getSnapshot : readUnknown,
    enabled ? store.getServerSnapshot : readUnknown,
  );
}
