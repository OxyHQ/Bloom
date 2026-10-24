import { useEffect, useState, useSyncExternalStore } from 'react';

import { controlFor } from './player-control';
import type { ControlledVideoPlayer } from './types';

/**
 * Apply one presenter's answer (normally `useVideoPlayback().shouldPlay`) to a
 * player that other presenters may share: it plays while ANY presenter says so,
 * and is re-told after a source change or once it becomes ready. Returns whether
 * the player has painted a frame, latched, so a re-buffer never re-shows a poster.
 */
export function useVideoPlaybackControl(
  player: ControlledVideoPlayer,
  shouldPlay: boolean,
  shouldLoad: boolean = shouldPlay,
): boolean {
  // One slot for the presenter's identity and the control of the player it is
  // handed now: a feed row mounts this per video, and every slot counts there.
  const [current, setCurrent] = useState(() => ({
    owner: {},
    player,
    control: controlFor(player),
  }));
  if (current.player !== player) {
    setCurrent({ owner: current.owner, player, control: controlFor(player) });
  }
  const { owner, control } = current;
  useEffect(() => {
    control.publish(owner, { shouldPlay, shouldLoad });
  }, [control, owner, shouldPlay, shouldLoad]);
  useEffect(() => () => control.remove(owner), [control, owner]);
  return useSyncExternalStore(
    control.subscribe,
    control.getRenderedFrame,
    control.getRenderedFrame,
  );
}
