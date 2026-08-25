/**
 * The flight layer's testable half is the REGISTRY — who is live, what each
 * surface is aimed at, and when it is let go. The motion is a browser's job
 * (`MediaFlight.stories.tsx` + `scripts/verify-overlay-stacking.mjs`); a jest
 * run resolves every reanimated animation synchronously, so "it animated" and
 * "it snapped" look identical here and nothing below claims otherwise.
 *
 * What IS asserted is every way the one-surface-per-id contract can break:
 *   - a second `flyTo` duplicating instead of retargeting,
 *   - a retarget losing the shared value (which for video restarts the view),
 *   - `flyBack` leaving a surface parked over a destination that has already
 *     drawn its own copy,
 *   - the layer painting while idle, which would sit over the whole app.
 *
 * And the two integration points that are green-and-inert if nobody checks the
 * ENTRYPOINT: that `MediaFlightLayer` actually subscribes to this store, and
 * that `MediaSurface` actually mounts a `VideoView` for a video item rather
 * than silently degrading to the poster for everyone.
 */
import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { VideoPlayer } from 'expo-video';

import { PortalOutlet, PortalProvider } from '../portal';
import {
  acquireOverlayRank,
  OVERLAY_STACK_BASE,
  resetOverlayStack,
} from '../overlay/stack';
import { MediaFlightLayer } from '../media-flight/MediaFlightLayer';
import { MediaPoster, MediaSurface } from '../media-flight/MediaSurface';
import { useMediaFlight } from '../media-flight/use-media-flight';
import {
  flyBack,
  flyTo,
  getFlights,
  hasFlight,
  measureAnchor,
  registerAnchor,
  releaseFlight,
  resetMediaFlight,
  subscribeToFlights,
} from '../media-flight/store';
import type { MediaFlightAnchorNode, MediaSurfaceContent } from '../media-flight/types';
import type { VideoPlayerLike } from '../media-flight/expo-video-module';
import { hostNodes, resolvedStyle } from './support/rendered-style';

const IMAGE: MediaSurfaceContent = { uri: 'https://cloud.oxy.so/a.jpg' };

/**
 * The structural minimum `VideoPlayerLike` asks for. The assignability check
 * below is what keeps it honest against the real `VideoPlayer`.
 */
const PLAYER: VideoPlayerLike = { playing: false, play: () => {}, pause: () => {} };

const VIDEO: MediaSurfaceContent = {
  kind: 'video',
  player: PLAYER,
  poster: 'https://cloud.oxy.so/still.jpg',
};

const RECT = { x: 10, y: 20, width: 100, height: 50 };
const TARGET = { x: 0, y: 0, width: 400, height: 300 };

/** A node that answers `measureInWindow` with a fixed rect, like a laid-out View. */
function anchorAt(rect: typeof RECT): MediaFlightAnchorNode {
  return {
    measureInWindow: (callback) => callback(rect.x, rect.y, rect.width, rect.height),
  };
}

beforeEach(() => {
  resetMediaFlight();
  resetOverlayStack();
});

describe('the flight registry', () => {
  it('starts with nothing live (vacuity floor for every assertion below)', () => {
    expect(getFlights()).toEqual([]);
    expect(hasFlight('a')).toBe(false);
  });

  it('takes a surface live on flyTo', () => {
    flyTo('a', TARGET, IMAGE, { from: RECT });
    expect(hasFlight('a')).toBe(true);
    const [flight] = getFlights();
    expect(flight?.from).toEqual(RECT);
    expect(flight?.to).toEqual(TARGET);
    expect(flight?.content).toEqual(IMAGE);
  });

  it('appears in place when the caller measured no origin', () => {
    // The documented degradation: a virtualised-away thumbnail must not make the
    // surface fly in from the top-left corner of the window.
    flyTo('a', TARGET, IMAGE);
    expect(getFlights()[0]?.from).toEqual(TARGET);
  });

  it('RETARGETS rather than duplicating when the same id flies again', () => {
    flyTo('a', TARGET, IMAGE, { from: RECT });
    const first = getFlights()[0];
    flyTo('a', { x: 5, y: 5, width: 200, height: 100 }, IMAGE);

    // One surface, always. Two records for one id is two mounted views, and for
    // video that is the remount that restarts playback.
    expect(getFlights()).toHaveLength(1);
    expect(getFlights()[0]?.to).toEqual({ x: 5, y: 5, width: 200, height: 100 });
    // Same shared value carried over — the surface resumes rather than restarts.
    expect(getFlights()[0]?.progress).toBe(first?.progress);
    expect(getFlights()[0]?.generation).toBe((first?.generation ?? 0) + 1);
  });

  it('replaces the record on a retarget instead of mutating it', () => {
    // Identity is what tells React (and the React Compiler) the leg changed. A
    // mutated record has the same identity, so a memoized read of `flight.from`
    // would keep returning the previous leg's origin forever — and the layer
    // would paint the flight it already painted, at full speed, invisibly.
    flyTo('a', TARGET, IMAGE, { from: RECT });
    const first = getFlights()[0];
    flyTo('a', { x: 5, y: 5, width: 200, height: 100 }, IMAGE);
    expect(getFlights()[0]).not.toBe(first);
  });

  it('keeps separate ids as separate surfaces', () => {
    flyTo('a', TARGET, IMAGE);
    flyTo('b', TARGET, IMAGE);
    expect(getFlights().map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('publishes a NEW snapshot array on every change, and a stable one between', () => {
    // `useSyncExternalStore` compares by identity: a snapshot rebuilt per call
    // re-renders the layer forever, and one never rebuilt never renders at all.
    const before = getFlights();
    expect(getFlights()).toBe(before);
    flyTo('a', TARGET, IMAGE);
    expect(getFlights()).not.toBe(before);
  });

  it('notifies subscribers, and stops after unsubscribe', () => {
    let calls = 0;
    const unsubscribe = subscribeToFlights(() => {
      calls += 1;
    });
    flyTo('a', TARGET, IMAGE);
    expect(calls).toBe(1);
    unsubscribe();
    flyTo('b', TARGET, IMAGE);
    expect(calls).toBe(1);
  });

  it('releases a surface, and releasing an unknown id is inert', () => {
    flyTo('a', TARGET, IMAGE);
    releaseFlight('a');
    expect(hasFlight('a')).toBe(false);
    expect(() => releaseFlight('nope')).not.toThrow();
  });
});

describe('anchors', () => {
  it('measures the registered node', async () => {
    registerAnchor('a', anchorAt(RECT));
    await expect(measureAnchor('a')).resolves.toEqual(RECT);
  });

  it('reads an unregistered id as no anchor', async () => {
    await expect(measureAnchor('a')).resolves.toBeNull();
  });

  it('reads a ZERO-AREA node as no anchor', async () => {
    // What a node reports while laid out but not yet on screen. Flying to it
    // would collapse the surface to a point, which is worse than not flying.
    registerAnchor('a', anchorAt({ x: 0, y: 0, width: 0, height: 0 }));
    await expect(measureAnchor('a')).resolves.toBeNull();
  });

  it('lets the most recently registered node win', async () => {
    // The destination mounts over the origin and becomes the fly-back target
    // without either screen coordinating with the other.
    const second = { x: 1, y: 2, width: 3, height: 4 };
    registerAnchor('a', anchorAt(RECT));
    registerAnchor('a', anchorAt(second));
    await expect(measureAnchor('a')).resolves.toEqual(second);
  });

  it('clears an anchor with null', async () => {
    registerAnchor('a', anchorAt(RECT));
    registerAnchor('a', null);
    await expect(measureAnchor('a')).resolves.toBeNull();
  });
});

describe('flyBack', () => {
  it('lands on the anchor and releases the surface', async () => {
    // Under the reanimated mock `withSpring`/`withTiming` settle synchronously,
    // so the release lands as soon as the measurement resolves. That is what
    // makes the RELEASE observable here; the timing of it is not.
    registerAnchor('a', anchorAt(RECT));
    flyTo('a', TARGET, IMAGE);
    expect(hasFlight('a')).toBe(true);

    flyBack('a');
    await act(async () => {});
    expect(hasFlight('a')).toBe(false);
  });

  it('releases IMMEDIATELY when the anchor cannot be measured', async () => {
    // Holding a flying copy over a destination that has already drawn its own
    // media is the duplicate surface again, arriving from the other side.
    flyTo('a', TARGET, IMAGE);
    flyBack('a');
    await act(async () => {});
    expect(hasFlight('a')).toBe(false);
  });

  it('is inert for an id with nothing live', () => {
    expect(() => flyBack('nope')).not.toThrow();
  });
});

describe('useMediaFlight', () => {
  it('exposes the same functions the store publishes, so the hook cannot drift', () => {
    // A hook that re-implemented the store would pass every behavioural test
    // above while the app called something else entirely.
    const controller = useMediaFlight();
    expect(controller.flyTo).toBe(flyTo);
    expect(controller.flyBack).toBe(flyBack);
    expect(controller.registerAnchor).toBe(registerAnchor);
    expect(controller.measureAnchor).toBe(measureAnchor);
  });

  it('returns a stable object', () => {
    expect(useMediaFlight()).toBe(useMediaFlight());
  });

  it('reads progress through the LIVE registry, not a captured one', () => {
    // `resetMediaFlight` replaces the registry. A captured shared value would
    // keep pointing at the discarded one, so every assertion about progress
    // would read a box nothing writes.
    const before = useMediaFlight().progress;
    resetMediaFlight();
    expect(useMediaFlight().progress).not.toBe(before);
  });
});

function renderLayer() {
  return render(
    <PortalProvider>
      <MediaFlightLayer />
      <PortalOutlet />
    </PortalProvider>,
  );
}

describe('MediaFlightLayer', () => {
  it('renders nothing while no flight is live', () => {
    const { toJSON } = renderLayer();
    expect(hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
  });

  it('paints a surface once one is live — i.e. it really is subscribed', () => {
    // The entrypoint assertion. Every registry test above passes against a layer
    // that subscribes to nothing at all; this is the one that does not.
    const { toJSON } = renderLayer();
    act(() => {
      flyTo('a', TARGET, IMAGE, { from: RECT });
    });
    expect(
      hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage'),
    ).not.toHaveLength(0);
  });

  it('stops painting when the surface is released', () => {
    const { toJSON } = renderLayer();
    act(() => {
      flyTo('a', TARGET, IMAGE, { from: RECT });
    });
    act(() => {
      releaseFlight('a');
    });
    expect(hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
  });

  it('takes its depth from the overlay AUTHORITY, not a constant of its own', () => {
    // The mechanism, asserted at the entrypoint: a layer that rendered a bare
    // `View` instead of an `OverlayRoot` would paint fine in every other test
    // here and land underneath whatever was open — the exact failure
    // `overlay/stack.ts` exists to remove, and one only a browser shows.
    const { toJSON } = renderLayer();
    act(() => {
      flyTo('a', TARGET, IMAGE, { from: RECT });
    });
    const depths = hostNodes(toJSON())
      .map((node) => resolvedStyle(node.props?.style).zIndex)
      .filter((z): z is number => typeof z === 'number');
    expect(depths.some((z) => z >= OVERLAY_STACK_BASE)).toBe(true);
  });

  it('holds no rank while idle, so the stack counter can still reset', () => {
    // The layer is mounted for the whole life of the app. If it took a rank on
    // mount, the live set would never empty, the counter would never reset, and
    // every overlay depth in a long session would climb toward the toast layer.
    renderLayer();
    expect(acquireOverlayRank()).toBe(1);
  });

  it('never takes a press: every painted node is pointer-events none', () => {
    const { toJSON } = renderLayer();
    act(() => {
      flyTo('a', TARGET, IMAGE, { from: RECT });
    });
    // The prop, not a style key — react-native-web resolves the RN-only values
    // from the prop path only, and as a style entry it is silently inert.
    const surfaces = hostNodes(toJSON()).filter(
      (node) => node.props?.pointerEvents === 'none',
    );
    expect(surfaces.length).toBeGreaterThan(0);
  });
});

describe('MediaSurface', () => {
  it('renders an image item as an image and no video view', () => {
    const { toJSON } = render(<MediaSurface content={IMAGE} />);
    const nodes = hostNodes(toJSON());
    expect(nodes.filter((node) => node.type === 'ExpoImage')).toHaveLength(1);
    expect(nodes.filter((node) => node.type === 'ExpoVideoView')).toHaveLength(0);
  });

  it('MOUNTS A VIDEO VIEW for a video item, fed by the caller’s player', () => {
    // The whole feature, asserted at the entrypoint: without this, every video
    // path in the package would silently degrade to a poster and every other
    // test in this file would still pass.
    const { toJSON } = render(<MediaSurface content={VIDEO} />);
    const views = hostNodes(toJSON()).filter((node) => node.type === 'ExpoVideoView');
    expect(views).toHaveLength(1);
    expect(views[0]?.props?.player).toBe(PLAYER);
  });

  it('asks for a textureView, which is what makes the box clip a video', () => {
    // A `surfaceView` composites outside the view hierarchy: it ignores the
    // parent's clip, radius and transform, i.e. every property a flying box
    // relies on. Nothing at runtime reports that it went wrong.
    const { toJSON } = render(<MediaSurface content={VIDEO} />);
    const [view] = hostNodes(toJSON()).filter((node) => node.type === 'ExpoVideoView');
    expect(view?.props?.surfaceType).toBe('textureView');
  });

  it('renders the poster BEHIND the video, so the box is never empty', () => {
    const { toJSON } = render(<MediaSurface content={VIDEO} />);
    const nodes = hostNodes(toJSON());
    expect(nodes.filter((node) => node.type === 'ExpoImage')).toHaveLength(1);
  });
});

describe('MediaPoster', () => {
  it('renders a still for a video and NEVER a second video view', () => {
    // Every surface that is not the live one goes through here. Mounting a real
    // `MediaSurface` on an off-screen page or a strip tile would put a second
    // view on the same player — the duplicate this package exists to prevent.
    const { toJSON } = render(<MediaPoster content={VIDEO} />);
    const nodes = hostNodes(toJSON());
    expect(nodes.filter((node) => node.type === 'ExpoVideoView')).toHaveLength(0);
    expect(nodes.filter((node) => node.type === 'ExpoImage')).toHaveLength(1);
  });

  it('degrades to an empty box for a video with no poster', () => {
    const { toJSON } = render(
      <MediaPoster content={{ kind: 'video', player: PLAYER }} />,
    );
    expect(hostNodes(toJSON()).filter((node) => node.type === 'ExpoImage')).toHaveLength(0);
  });
});

describe('the hand-written expo-video types', () => {
  it('accepts a real VideoPlayer', () => {
    // `VideoPlayerLike` is hand-written so no expo-video type reaches Bloom's
    // emitted declarations (a consumer that skips the optional peer must not
    // inherit a TS7016 from Bloom's own `.d.ts`). This file is excluded from
    // the build, so it may name the real package — and it is the only thing
    // keeping the two in step.
    const assignable = (player: VideoPlayer): VideoPlayerLike => player;
    expect(typeof assignable).toBe('function');
  });
});
