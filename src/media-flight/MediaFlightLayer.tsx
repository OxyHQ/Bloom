/**
 * The layer that survives navigation.
 *
 * ## The problem it exists for
 *
 * A shared-element transition normally assumes the ORIGIN screen is still
 * mounted while the element travels — which is why `react-native-teleport` needs
 * `presentation: 'transparentModal'` and has no web story at all. Under
 * expo-router on web the origin route is UNMOUNTED the moment the URL changes,
 * so anything the origin was rendering (a `VideoView`, a decoded image) is gone
 * before the first frame of the transition.
 *
 * The fix is to move the surface OUT of both screens for the duration of the
 * flight. `<MediaFlightLayer>` is mounted ONCE at the app root and renders
 * through Bloom's `Portal`, whose outlet lives above the router on both
 * platforms — so the surface it paints belongs to neither route and neither
 * route can take it down. Origin and destination only DECLARE where they want
 * it (`registerAnchor` + `flyTo`); the layer is what actually paints it.
 *
 * ## One surface per id
 *
 * That is the contract, and for video it is the whole feature. expo-video keeps
 * the `VideoPlayer` OBJECT separate from the `VideoView` that shows it, and one
 * player may feed several views — so moving a video is a matter of mounting ONE
 * view in the right place, never of creating a second player. A second surface
 * for the same id would mean two views mounted over one another and a visible
 * swap; the store enforces one by RETARGETING an existing flight rather than
 * adding to it.
 *
 * ## It never takes a click
 *
 * Every node here is `pointerEvents="none"` (or `box-none` on the root, via
 * `OverlayRoot`). A flying surface is a picture of something the app is already
 * showing: the controls underneath it stay the ones the user is pressing, and a
 * layer mounted for the whole life of the app that swallowed presses would be
 * indistinguishable from a frozen UI.
 */
import { useSyncExternalStore } from 'react';
import { StyleSheet } from 'react-native';
import { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { MediaSurface } from './MediaSurface';
import { getFlights, subscribeToFlights } from './store';
import type { MediaFlight } from './types';

/**
 * Mount ONCE, at the app root, above the router. Renders nothing at all until a
 * flight is live, so it costs a subscription and no view while idle — and takes
 * an overlay rank only while it is actually painting, which is what keeps the
 * overlay stack's counter able to reset (see `overlay/stack.ts`).
 */
export function MediaFlightLayer() {
  const flights = useSyncExternalStore(subscribeToFlights, getFlights, getFlights);

  if (flights.length === 0) return null;

  return (
    <Portal>
      {/* `OverlayRoot` fills the viewport, is `box-none`, and takes this
          surface's place in the open-order overlay stack — so a flight started
          over an open dialog paints above it, and one started under a later
          sheet goes behind. */}
      <OverlayRoot>
        {flights.map((flight) => (
          <MediaFlightSurface key={flight.id} flight={flight} />
        ))}
      </OverlayRoot>
    </Portal>
  );
}

MediaFlightLayer.displayName = 'MediaFlightLayer';

/**
 * One flying surface.
 *
 * ## Why the size is animated rather than scaled
 *
 * The media gallery flies its images with a uniform `scale`, which is right
 * there: it opens from a thumbnail into a box of the SAME aspect ratio, so one
 * factor describes the whole move. A flight does not have that luxury — it
 * routinely goes from a cropped square tile to a 16:9 player — and a uniform
 * scale would leave the first frame the wrong height, i.e. visibly not the
 * thumbnail it is supposed to be replacing. Interpolating `width`/`height` is
 * exact at both ends; the position still rides a transform, so the only layout
 * work per frame is one absolutely-positioned node resizing.
 */
function MediaFlightSurface({ flight }: { flight: MediaFlight }) {
  const { from, to, progress, content, cornerRadius, contentFit } = flight;

  // Deltas rather than absolute rects, so the worklet closes over four numbers.
  const originX = from.x - to.x;
  const originY = from.y - to.y;

  // CRITICAL — every shared value a mapper READS must be listed in its deps.
  // On web WITHOUT the react-native-worklets babel plugin, reanimated cannot
  // auto-detect the reads and drives the mapper off the deps array instead:
  // with none, it runs ONCE and freezes at the opening frame while `progress`
  // animates underneath it. Same rule as `ZoomableMediaGallery` and
  // `BottomSheetBase`. Do NOT strip these.
  const boxStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [originX, 0]) },
        { translateY: interpolate(progress.value, [0, 1], [originY, 0]) },
      ],
      width: interpolate(progress.value, [0, 1], [from.width, to.width]),
      height: interpolate(progress.value, [0, 1], [from.height, to.height]),
    }),
    [progress, originX, originY, from.width, from.height, to.width, to.height],
  );

  return (
    <MediaSurface
      content={content}
      contentFit={contentFit}
      // A flying surface is a picture, never a control: it must not intercept
      // the press that is already travelling to whatever is underneath it.
      pointerEvents="none"
      style={[styles.box, { left: to.x, top: to.y, borderRadius: cornerRadius }, boxStyle]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
