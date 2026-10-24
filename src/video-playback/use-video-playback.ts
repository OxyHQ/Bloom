import { useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';

import { IS_WEB } from '../styles/platform';
import { useScreenVisible } from '../screen/use-screen-visible';
import {
  resolveNativeVisibility,
  useKeyRank,
  VideoPlaybackContext,
  VideoViewabilityContext,
} from './context';
import { domElementOf } from './dom-element';
import type { UseVideoPlaybackOptions, UseVideoPlaybackResult } from './types';

/** At least half of the player on screen counts as on screen. */
const VISIBLE_THRESHOLD = 0.5;

interface WebVisibility {
  y: number;
  isIntersecting: boolean;
}

/**
 * Nothing observed yet, so a web player starts hidden: an off-screen video must
 * never get a head start on audio before its first observation.
 */
const UNOBSERVED: WebVisibility = { y: 0, isIntersecting: false };

/**
 * One player's answer from the {@link VideoPlaybackProvider}: play only while
 * visible on a visible screen, and among the visible audible players only the
 * one elected. Contract: `docs/video-playback.mdx`.
 */
export function useVideoPlayback({
  id,
  target,
  viewabilityKey,
  silent = false,
  ownsSession = false,
}: UseVideoPlaybackOptions): UseVideoPlaybackResult {
  const authority = useContext(VideoPlaybackContext);
  if (!authority) {
    throw new Error('useVideoPlayback must be used inside a <VideoPlaybackProvider>');
  }
  const { active, publish, unpublish, claimActive: claimActiveById } = authority;
  // This player's own slice of the election, so a new winner wakes two players.
  const readIsActive = (): boolean => active.get() === id;
  const isActive = useSyncExternalStore(active.subscribe, readIsActive, readIsActive);

  const viewabilitySource = useContext(VideoViewabilityContext);
  const keyRank = useKeyRank(viewabilitySource, viewabilityKey);
  const screenVisible = useScreenVisible();

  const [webVisibility, setWebVisibility] = useState<WebVisibility>(UNOBSERVED);
  const reportVisibility = useCallback((y: number, isIntersecting: boolean) => {
    setWebVisibility((previous) =>
      previous.y === y && previous.isIntersecting === isIntersecting
        ? previous
        : { y, isIntersecting },
    );
  }, []);

  // Web: the player's own observer is its visibility source. It reports the
  // centre-Y (which contests the audible slot) AND whether it still intersects,
  // which is what makes a scrolled-past video go silent. Silent players report
  // too: an off-screen GIF must stop decoding.
  useEffect(() => {
    if (!IS_WEB || !target) return;
    const element = domElementOf(target.current);
    if (!element || typeof IntersectionObserver === 'undefined') {
      // Nothing to observe with: visible, so the screen still works rather than
      // silently never playing.
      reportVisibility(0, true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const box = entry.boundingClientRect;
        reportVisibility(box.y + box.height / 2, entry.isIntersecting);
      },
      { threshold: VISIBLE_THRESHOLD },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, reportVisibility]);

  const native = resolveNativeVisibility(viewabilitySource, keyRank);
  const visible = IS_WEB ? webVisibility.isIntersecting : native.visible;
  const order = IS_WEB ? webVisibility.y : native.order;
  // A PiP owner is eligible whatever the layout says: the screen that opened the
  // session leaves that surface behind on purpose (the pager moves on, the app
  // is backgrounded), so its viewability describes what the viewer is not shown.
  const eligible = ownsSession || (visible && screenVisible);

  // Publishing candidacy into the imperative registry, and removing it on
  // unmount (which releases the slot), is a subscribe-with-cleanup effect. Split
  // in two so a position update never unpublishes and hands the slot away for a frame.
  // The registration carries `target` itself, so the provider measures it at
  // election time without a per-player callback slot.
  useEffect(() => {
    publish(id, { silent, eligible, order, ownsSession, target });
  }, [publish, id, silent, eligible, order, ownsSession, target]);

  useEffect(() => () => unpublish(id), [unpublish, id]);

  const claimActive = useCallback(() => claimActiveById(id), [claimActiveById, id]);

  return {
    shouldPlay: eligible && (silent || isActive),
    canLoad: ownsSession || screenVisible,
    claimActive,
    reportVisibility,
  };
}
