import { useEffect, useState, useSyncExternalStore } from 'react';

import { controlFor } from './player-control';
import type { ControlledVideoPlayer } from './types';

const subscribeNothing = (): (() => void) => () => {};
const noFrame = (): boolean => false;

/**
 * Apply one presenter's answer (normally `useVideoPlayback().shouldPlay`) to a
 * player that other presenters may share: it plays while ANY presenter says so,
 * and is re-told after a source change or once it becomes ready. Returns whether
 * the player has painted a frame, latched, so a re-buffer never re-shows a poster.
 *
 * `player` may be `null`: a presenter whose player is not attached yet (a row
 * outside its list's preload window, `useViewableNear`) asks nothing and has
 * painted nothing, so it keeps its poster, and the same component takes the
 * player when one is attached without remounting what it draws around it.
 */
export function useVideoPlaybackControl(
  player: ControlledVideoPlayer | null,
  shouldPlay: boolean,
  shouldLoad: boolean = shouldPlay,
): boolean {
  // One slot for the presenter's identity and the control of the player it is
  // handed now: a feed row mounts this per video, and every slot counts there.
  const [current, setCurrent] = useState(() => ({
    owner: {},
    player,
    control: player ? controlFor(player) : null,
  }));
  if (current.player !== player) {
    setCurrent({ owner: current.owner, player, control: player ? controlFor(player) : null });
  }
  const { owner, control } = current;
  useEffect(() => {
    control?.publish(owner, { shouldPlay, shouldLoad });
  }, [control, owner, shouldPlay, shouldLoad]);
  useEffect(() => () => control?.remove(owner), [control, owner]);
  return useSyncExternalStore(
    control?.subscribe ?? subscribeNothing,
    control?.getRenderedFrame ?? noFrame,
    control?.getRenderedFrame ?? noFrame,
  );
}
