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
import { registerAnchor } from './store';
import type { MediaFlightHostProps } from './types';

export function MediaFlightHost({
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
}: MediaFlightHostProps) {
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
        renderVideo={renderVideo}
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
