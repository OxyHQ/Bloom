import { useCallback, useMemo, useRef, useState, type ReactElement } from 'react';
import { Dimensions } from 'react-native';

import { IS_WEB } from '../styles/platform';
import {
  createValueStore,
  VideoPlaybackContext,
  type PlayerRegistration,
  type VideoPlaybackContextValue,
} from './context';
import { viewportCenterYOf } from './dom-element';
import type { VideoPlaybackProviderProps } from './types';

/**
 * The viewport line the audible video is chosen against, as a fraction of the
 * window height: slightly above the centre, the line the eye rests on while
 * scrolling a feed.
 */
const IDEAL_VIEWPORT_LINE_DIVISOR = 2.5;

/**
 * The single app-wide authority answering "may this player play right now?".
 * Mount ONE, above every screen that plays video. Contract: `docs/video-playback.mdx`.
 */
export function VideoPlaybackProvider({ children }: VideoPlaybackProviderProps): ReactElement {
  const [active] = useState(() => createValueStore<string | null>(null));

  // Mounted players and the viewer's manual override live outside React state on
  // purpose: registrations churn while scrolling and must not re-render the tree.
  // Only the resulting winner does, and only for the players it concerns.
  const playersRef = useRef<Map<string, PlayerRegistration>>(new Map());
  const manualIdRef = useRef<string | null>(null);

  // Called from event handlers and effects, never during render, so reading the
  // imperative registry and the live window height here is safe.
  const reselect = useCallback(() => {
    const players = playersRef.current;
    const idealY = Dimensions.get('window').height / IDEAL_VIEWPORT_LINE_DIVISOR;

    // A PiP owner outranks BOTH the manual override and the viewport ranking:
    // the OS is showing it outside the app, so it is the only one the viewer can
    // see, and the rules below rank surfaces against a layout nobody is looking
    // at. A tie resolves on the id, so the winner never depends on Map order.
    let sessionId: string | null = null;
    for (const [id, registration] of players) {
      if (registration.ownsSession && (sessionId === null || id < sessionId)) sessionId = id;
    }
    if (sessionId !== null) {
      active.set(sessionId);
      return;
    }

    // A manually played video keeps the slot while it stays visible. Once it
    // scrolls away (or unmounts) the override is dropped for good.
    const manualId = manualIdRef.current;
    if (manualId !== null) {
      const manual = players.get(manualId);
      if (manual?.eligible && !manual.silent) {
        active.set(manualId);
        return;
      }
      manualIdRef.current = null;
    }

    let bestId: string | null = null;
    let bestRank = Number.POSITIVE_INFINITY;
    for (const [id, registration] of players) {
      if (registration.silent || !registration.eligible) continue;
      // Measured HERE, the only moment "closest to the line" is answered about
      // now rather than about the last threshold crossing.
      const current = IS_WEB ? viewportCenterYOf(registration.target?.current) : undefined;
      const order = current ?? registration.order;
      const rank = IS_WEB ? Math.abs(order - idealY) : order;
      // Equal rank is real (two videos in one multi-media row share a key), so it
      // resolves on the id: the winner is a function of the candidates alone,
      // never of insertion or mount order.
      if (rank < bestRank || (rank === bestRank && bestId !== null && id < bestId)) {
        bestRank = rank;
        bestId = id;
      }
    }
    // No visible audible candidate: NOTHING plays until one reports itself visible.
    active.set(bestId);
  }, [active]);

  const publish = useCallback(
    (id: string, registration: PlayerRegistration) => {
      playersRef.current.set(id, registration);
      reselect();
    },
    [reselect],
  );

  const unpublish = useCallback(
    (id: string) => {
      playersRef.current.delete(id);
      reselect();
    },
    [reselect],
  );

  const claimActive = useCallback(
    (id: string) => {
      manualIdRef.current = id;
      reselect();
    },
    [reselect],
  );

  const value = useMemo<VideoPlaybackContextValue>(
    () => ({ active, publish, unpublish, claimActive }),
    [active, publish, unpublish, claimActive],
  );

  return <VideoPlaybackContext.Provider value={value}>{children}</VideoPlaybackContext.Provider>;
}
