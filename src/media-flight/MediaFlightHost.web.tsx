/**
 * A place a media surface lives — WEB, where it does NOT render the media.
 *
 * This host renders an empty box and CLAIMS the shared node for its id. The
 * media itself is one DOM node the layer paints once and moves between hosts
 * with `appendChild`, so a video keeps its element, its decoder and its
 * position when the origin route unmounts mid-flight. See `media-node.web.ts`
 * for why one element is the only topology that keeps both the position and the
 * playback.
 *
 * The consumer writes the same JSX as on native and never learns the
 * difference — including that here, `flightId` is not needed: a flight ends
 * when a destination host claims the node, and the node it claims has been
 * showing the media all along.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  HOST_RANK,
  claimMediaNode,
  releaseMediaNode,
  type MediaNodeRender,
} from './media-node.web';
import type { VideoPlayerLike } from './expo-video-module';
import { handOffFlight, hasFlight, registerAnchor } from './store';
import type { MediaFlightHostProps, MediaVideoSlot } from './types';

/**
 * The web host publishes its slot to the layer, which paints every shared node
 * through one non-generic `MediaSurface`. Widening is sound for the same reason
 * as the native host's `widenSlot`: the only player Bloom ever hands a slot is
 * the one it took out of that slot's own `content`. Bloom transports the
 * object; it never substitutes one.
 */
export function MediaFlightHost<P extends VideoPlayerLike = VideoPlayerLike>({
  id,
  content,
  style,
  contentFit = 'cover',
  renderVideo,
  nativeControls = false,
  accessibilityLabel,
  pointerEvents,
  flightId,
}: MediaFlightHostProps<P>) {
  // State rather than a ref, because the claim runs in a layout effect and an
  // effect cannot depend on a ref's mutation. One extra render at mount.
  const [node, setNode] = useState<View | null>(null);

  const setHost = useCallback(
    (next: View | null) => {
      registerAnchor(id, next);
      setNode(next);
    },
    [id],
  );

  const render = useMemo<MediaNodeRender>(
    () => ({
      content,
      contentFit,
      // See `widenSlot`: the player a slot gets back is the one it put in.
      renderVideo: renderVideo as MediaVideoSlot | undefined,
      nativeControls,
      accessibilityLabel,
      flightId,
    }),
    [content, contentFit, renderVideo, nativeControls, accessibilityLabel, flightId],
  );
  const renderRef = useRef(render);

  // Declared FIRST so it runs first on mount: it seeds the ref the claim below
  // reads, and afterwards it is what pushes prop changes into a live claim —
  // in place, without releasing, because a release would move the node and a
  // move away and back is a removal, which is what pauses a video.
  useLayoutEffect(() => {
    renderRef.current = render;
    const el = node as unknown as HTMLElement | null;
    if (el !== null) claimMediaNode(id, el, HOST_RANK, render);
  }, [id, node, render]);

  // Owns the claim's LIFETIME, and only that: its cleanup must run when the
  // host really goes away, never on a prop change.
  useLayoutEffect(() => {
    const el = node as unknown as HTMLElement | null;
    if (el === null) return undefined;
    claimMediaNode(id, el, HOST_RANK, renderRef.current);
    // A new host appearing mid-flight IS the hand-off. On native the
    // destination has to decode a first frame before it can say this; here the
    // node it just claimed is the one that has been playing since the origin,
    // so mounting is the whole signal. An origin host does not reach this with
    // a flight live — it claimed before the flight began.
    if (hasFlight(id)) handOffFlight(id);
    return () => releaseMediaNode(id, el, HOST_RANK);
  }, [id, node]);

  return <View ref={setHost} style={style} pointerEvents={pointerEvents} />;
}

MediaFlightHost.displayName = 'MediaFlightHost';
