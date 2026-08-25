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
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { StyleSheet, type View } from 'react-native';
import { createPortal } from 'react-dom';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { MediaSurface, type MediaSurfaceStyle } from './MediaSurface';
import {
  FLIGHT_RANK,
  claimMediaNode,
  getMediaNodes,
  releaseMediaNode,
  subscribeToMediaNodes,
  type MediaNodeRender,
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
  const { content, contentFit, nativeControls, accessibilityLabel, flightId } = node.render;
  return createPortal(
    <MediaSurface
      content={content}
      contentFit={contentFit}
      nativeControls={nativeControls}
      accessibilityLabel={accessibilityLabel}
      flightId={flightId}
      style={StyleSheet.absoluteFill}
    />,
    node.wrapper,
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

  const render = useMemo<MediaNodeRender>(
    () => ({
      content,
      contentFit,
      nativeControls: false,
      accessibilityLabel: undefined,
      // A flying surface never hands off to itself.
      flightId: undefined,
    }),
    [content, contentFit],
  );

  // The shared node is already painting this media. The flight is then a BOX
  // that borrows it for the length of the leg, never a second copy.
  if (shared) return <FlyingSharedNode id={id} style={box} render={render} />;

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
function FlyingSharedNode({
  id,
  style,
  render,
}: {
  id: string;
  style: MediaSurfaceStyle;
  render: MediaNodeRender;
}) {
  const [node, setNode] = useState<View | null>(null);
  const setBox = useCallback((next: View | null) => setNode(next), []);
  const renderRef = useRef(render);

  // Declared first so it runs first on mount, and afterwards is what pushes
  // prop changes into a live claim IN PLACE — releasing and re-claiming would
  // move the node away and back, and a move away is a removal.
  useLayoutEffect(() => {
    renderRef.current = render;
    const el = node as unknown as HTMLElement | null;
    if (el !== null) claimMediaNode(id, el, FLIGHT_RANK, render);
  }, [id, node, render]);

  // Owns the claim's LIFETIME, and only that.
  useLayoutEffect(() => {
    const el = node as unknown as HTMLElement | null;
    if (el === null) return undefined;
    claimMediaNode(id, el, FLIGHT_RANK, renderRef.current);
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
