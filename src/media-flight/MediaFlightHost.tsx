/**
 * A place a media surface lives — NATIVE.
 *
 * Here a host is exactly what it looks like: a box that renders its own
 * `MediaSurface`. Native has no equivalent of the web problem this component
 * exists for (a DOM `<video>` that must survive its React owner), and expo-video
 * on native hands a player between views without the pause mirroring that makes
 * two web elements mutually destructive. So this is the plain implementation,
 * and `MediaFlightHost.web.tsx` is the one that re-parents.
 *
 * ONE API, two implementations. A consumer writes the same JSX on both
 * platforms and never learns which one it got.
 */
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { MediaSurface } from './MediaSurface';
import type { VideoPlayerLike } from './expo-video-module';
import { registerAnchor } from './store';
import type { MediaFlightHostProps, MediaVideoSlot } from './types';

/**
 * Hand a consumer's slot to `MediaSurface`, which is not generic.
 *
 * SOUND, and the reason is the invariant this whole family is built on: the
 * only player Bloom ever passes to a slot is the one it took out of that
 * slot's own `content`. Bloom transports the object and never substitutes one,
 * so the value really is a `P` at runtime — the assertion says what the types
 * cannot follow through a `memo`'d component, and it lives HERE, once, rather
 * than in every consumer's `renderVideo`.
 */
function widenSlot<P extends VideoPlayerLike>(
  slot: MediaVideoSlot<P> | undefined,
): MediaVideoSlot | undefined {
  return slot as MediaVideoSlot | undefined;
}

export function MediaFlightHost<P extends VideoPlayerLike = VideoPlayerLike>({
  id,
  content,
  style,
  contentFit = 'cover',
  renderVideo,
  nativeControls = false,
  accessibilityLabel,
  surfaceType,
  pointerEvents,
  flightId,
}: MediaFlightHostProps<P>) {
  // A callback ref rather than an effect: the anchor must be measurable the
  // moment the box is on screen, and a tap can come one frame later.
  const setNode = useCallback(
    (node: View | null) => registerAnchor(id, node),
    [id],
  );

  return (
    <View ref={setNode} style={style} pointerEvents={pointerEvents}>
      <MediaSurface
        content={content}
        contentFit={contentFit}
        renderVideo={widenSlot(renderVideo)}
        nativeControls={nativeControls}
        accessibilityLabel={accessibilityLabel}
        surfaceType={surfaceType}
        flightId={flightId}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

MediaFlightHost.displayName = 'MediaFlightHost';
