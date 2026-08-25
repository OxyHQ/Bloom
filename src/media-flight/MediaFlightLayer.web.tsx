/**
 * The layer that survives navigation — WEB, where it also OWNS the media.
 *
 * Everything in `MediaFlightLayer.tsx` still holds: mounted once at the app
 * root, painting through `Portal` so a flying surface belongs to neither route.
 * What this fork adds is the other half of the web story.
 *
 * ## It paints each shared node exactly once, forever
 *
 * `createPortal(<MediaSurface …/>, wrapper)` for every id a host has claimed.
 * The wrapper is a plain `<div>` created OUTSIDE React by `media-node.web.ts`,
 * so React reconciles the media against a container whose identity never
 * changes while the registry moves that container between hosts with
 * `appendChild`. React never sees the move; the browser never sees a removal;
 * the video never loses its element, its decoder or its position.
 *
 * That is why the layer, and not the host, renders the media on web: the media
 * has to be rendered by a tree that outlives every host, and the app root is
 * the only such tree.
 *
 * ## A flying surface with a shared node paints nothing itself
 *
 * It becomes a positioned, animated BOX that claims the node — one more host,
 * outranking the others for the length of the leg. A flight for an id with no
 * shared node (an image gallery, any consumer that has not adopted a host)
 * falls back to painting its own `MediaSurface`, which is what every flight did
 * before hosts existed.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { StyleSheet, type View } from 'react-native';
import { createPortal } from 'react-dom';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { SLOT_FILL_TOLERANCE_PX } from './constants';
import { OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { MediaSurface, type MediaSurfaceStyle } from './MediaSurface';
import {
  FLIGHT_RANK,
  claimMediaNode,
  getMediaNodes,
  releaseMediaNode,
  subscribeToMediaNodes,
  type MediaNodeView,
} from './media-node.web';
import { getFlights, notifySurfaceMounted, subscribeToFlights } from './store';
import type { MediaFlight } from './types';

export function MediaFlightLayer() {
  const flights = useSyncExternalStore(subscribeToFlights, getFlights, getFlights);
  const nodes = useSyncExternalStore(subscribeToMediaNodes, getMediaNodes, getMediaNodes);

  if (flights.length === 0 && nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node) => (
        <SharedMediaNode key={node.id} node={node} />
      ))}
      {flights.length === 0 ? null : (
        <Portal>
          {/* `OverlayRoot` fills the viewport, is `box-none`, and takes this
              surface's place in the open-order overlay stack. */}
          <OverlayRoot>
            {flights.map((flight) => (
              <MediaFlightSurface
                key={flight.id}
                flight={flight}
                // Read from the SNAPSHOT, never from the registry: a lookup
                // during render is external mutable state in a memoized
                // position, which the React Compiler is allowed to freeze.
                shared={nodes.some((node) => node.id === flight.id)}
              />
            ))}
          </OverlayRoot>
        </Portal>
      )}
    </>
  );
}

MediaFlightLayer.displayName = 'MediaFlightLayer';

/** One media element, painted into the wrapper its id owns, and never again. */
function SharedMediaNode({ node }: { node: MediaNodeView }) {
  const { content, contentFit, renderVideo, nativeControls, accessibilityLabel, flightId } = node.render;

  // DOES THE MEDIA ACTUALLY FILL ITS BOX?
  //
  // Bloom hands a `renderVideo` slot a style that sizes a replaced element, and
  // a slot that forgets to spread it paints a 300x150 `<video>` inside whatever
  // box it was given — correct in every other respect, wrong on screen, and
  // reported by nothing. That defect shipped once from Bloom's own view and
  // cost a day to find; a consumer writing the slot can reproduce it in a line.
  //
  // Measured one frame after the commit, because layout has to have happened.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || renderVideo === undefined) return undefined;
    const frame = requestAnimationFrame(() => warnIfNotFilling(node.wrapper));
    return () => cancelAnimationFrame(frame);
  }, [node.wrapper, renderVideo]);

  return createPortal(
    <MediaSurface
      content={content}
      contentFit={contentFit}
      renderVideo={renderVideo}
      nativeControls={nativeControls}
      accessibilityLabel={accessibilityLabel}
      flightId={flightId}
      style={StyleSheet.absoluteFill}
    />,
    node.wrapper,
  );
}

let hasWarnedAboutFill = false;

/**
 * One warning per module lifetime, and none in production — same mechanism as
 * `warnExpoVideoUnavailable`.
 *
 * It compares the media element with the WRAPPER, not with a fixed size: the
 * invariant is "the media fills the box it was given", and a box that happens
 * to be 300x150 is not a defect.
 */
function warnIfNotFilling(wrapper: HTMLElement): void {
  if (hasWarnedAboutFill || !wrapper.isConnected) return;
  const media = wrapper.querySelector('video');
  if (media === null) return;
  const box = wrapper.getBoundingClientRect();
  const painted = media.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return;
  const off =
    Math.abs(painted.width - box.width) > SLOT_FILL_TOLERANCE_PX ||
    Math.abs(painted.height - box.height) > SLOT_FILL_TOLERANCE_PX;
  if (!off) return;
  hasWarnedAboutFill = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[Bloom] A \`renderVideo\` element is ${Math.round(painted.width)}x${Math.round(painted.height)} ` +
      `inside a ${Math.round(box.width)}x${Math.round(box.height)} box. A DOM \`<video>\` is a ` +
      'REPLACED element: without an explicit size it paints at its intrinsic 300x150 whatever ' +
      'its inset says. Spread the `style` Bloom passes the slot.',
  );
}

/**
 * One flying surface. See `MediaFlightLayer.tsx` for why the size is animated
 * rather than scaled.
 */
function MediaFlightSurface({ flight, shared }: { flight: MediaFlight; shared: boolean }) {
  const { id, from, to, progress, content, cornerRadius, contentFit, surfaceType, unbinding } = flight;

  useEffect(() => {
    notifySurfaceMounted(id);
  }, [id]);

  const originX = from.x - to.x;
  const originY = from.y - to.y;

  // CRITICAL — every shared value a mapper READS must be listed in its deps.
  // On web WITHOUT the react-native-worklets babel plugin, reanimated drives a
  // mapper off its deps array rather than off the reads it detects: with none,
  // it runs ONCE and freezes at the opening frame. See `MediaFlightLayer.tsx`.
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

  const box = [styles.box, { left: to.x, top: to.y, borderRadius: cornerRadius }, boxStyle];

  // The shared node is already painting this media. The flight is then a BOX
  // that borrows it for the length of the leg, never a second copy.
  if (shared) return <FlyingSharedNode id={id} style={box} />;

  return (
    <MediaSurface
      content={content}
      contentFit={contentFit}
      surfaceType={surfaceType}
      // One commit with no player before this node leaves the DOM — see
      // `releaseFlight`. Only the no-shared-node path can need it: a shared
      // node is never removed, which is the point of the whole mechanism.
      detached={unbinding}
      // A flying surface is a picture, never a control.
      pointerEvents="none"
      style={box}
    />
  );
}

/**
 * The flight's own claim on a shared node.
 *
 * `pointerEvents` stays `none` on the BOX: a flying surface must not take the
 * press travelling to whatever is underneath it. The wrapper inside sets
 * `pointer-events: auto` for the media's sake, which is what a host needs and
 * is inert here — a descendant asking for `auto` does not override a `none`
 * ancestor.
 */
function FlyingSharedNode({ id, style }: { id: string; style: MediaSurfaceStyle }) {
  const [node, setNode] = useState<View | null>(null);
  const setBox = useCallback((next: View | null) => setNode(next), []);

  // A POSITION-ONLY claim: it says where the node lives for the length of the
  // leg and nothing about what is painted in it. A flight that published a
  // render of its own would replace the hosts' — and swap a consumer's own
  // element out and back, which is two remounts in the middle of the one
  // operation whose whole point is that the element is never rebuilt.
  useLayoutEffect(() => {
    const el = node as unknown as HTMLElement | null;
    if (el === null) return undefined;
    claimMediaNode(id, el, FLIGHT_RANK);
    return () => releaseMediaNode(id, el, FLIGHT_RANK);
  }, [id, node]);

  return <Animated.View ref={setBox} style={style} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
