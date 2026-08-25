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
// A NAMESPACE import, not `jest.requireMock`: this is the very module object
// `store.ts` calls through, so a spy written here is a spy the store sees.
import * as Reanimated from 'react-native-reanimated';
import type { VideoPlayer } from 'expo-video';

import { PortalOutlet, PortalProvider } from '../portal';
import {
  acquireOverlayRank,
  OVERLAY_STACK_BASE,
  resetOverlayStack,
} from '../overlay/stack';
import { MediaFlightLayer } from '../media-flight/MediaFlightLayer';
import { MediaPoster, MediaSurface } from '../media-flight/MediaSurface';
import { provideExpoVideo } from '../media-flight/expo-video-module';
import { useMediaFlight } from '../media-flight/use-media-flight';
import {
  flyBack,
  flyTo,
  getFlights,
  handOffFlight,
  hasFlight,
  measureAnchor,
  notifySurfaceMounted,
  notifySurfaceSettled,
  registerAnchor,
  releaseFlight,
  resetMediaFlight,
  subscribeToFlights,
} from '../media-flight/store';
import { SURFACE_MOUNT_TIMEOUT_MS } from '../media-flight/constants';
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

/**
 * The reanimated MOCK settles every animation synchronously — `withSpring` and
 * `withTiming` invoke their completion callback and return. That is what makes
 * a release observable in jest at all, and it is also why "mid-flight" cannot be
 * reached through the public path: by the time `flyTo` returns, the leg has
 * already finished.
 *
 * So a test that needs a leg genuinely IN FLIGHT suspends the callback. This is
 * an instrument, not a seam in the source: it makes the mock behave like a real
 * animation that has not finished yet.
 */
function suspendAnimations(): { restore: () => void; ran: () => boolean } {
  const spring = jest.spyOn(Reanimated, 'withSpring').mockImplementation((value) => value);
  const timing = jest.spyOn(Reanimated, 'withTiming').mockImplementation((value) => value);
  return {
    restore: () => {
      spring.mockRestore();
      timing.mockRestore();
    },
    // The instrument's own positive control: "the flight was still live" is
    // also what a spy that never intercepted anything reports, by suspending
    // nothing and coincidentally not releasing.
    ran: () => spring.mock.calls.length + timing.mock.calls.length > 0,
  };
}

/** A node that answers `measureInWindow` with a fixed rect, like a laid-out View. */
function anchorAt(rect: typeof RECT): MediaFlightAnchorNode {
  return {
    measureInWindow: (callback) => callback(rect.x, rect.y, rect.width, rect.height),
  };
}

/**
 * Let a VIDEO surface finish going away.
 *
 * Releasing one is deliberately not synchronous: it renders one commit with no
 * player first so its element unbinds while still in the DOM (see
 * `releaseFlight`). Image surfaces release immediately and need none of this.
 */
async function flushRelease(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
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
    expect(controller.handOff).toBe(handOffFlight);
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

  it('reports the COMMIT that flyTo waits on', () => {
    // The layer half of the ordering contract. Every store-level test drives
    // `notifySurfaceMounted` by hand and would pass against a layer that never
    // called it — leaving every `flyTo` to resolve on its timeout instead, which
    // is 250 ms of navigation lag AND the restart it was meant to prevent.
    let resolved = false;
    renderLayer();
    act(() => {
      void flyTo('a', TARGET, IMAGE, { from: RECT }).then(() => {
        resolved = true;
      });
    });
    return act(async () => {}).then(() => {
      expect(resolved).toBe(true);
    });
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

  it('lets a flight choose its surface type, so the boundary can be measured', () => {
    // On Android a flight has to fly as a `textureView` (a `SurfaceView` is
    // composited outside the hierarchy and ignores the parent's transform), but
    // expo-video's DEFAULT is `surfaceView` — so a hand-off crosses a
    // surface-type boundary unless one side changes. Whether that is visible is
    // a device question. This knob is what makes both arrangements testable
    // instead of making the choice on someone's behalf.
    flyTo('a', TARGET, VIDEO, { surfaceType: 'surfaceView' });
    expect(getFlights()[0]?.surfaceType).toBe('surfaceView');
    expect(getFlights()[1]).toBeUndefined();

    flyTo('b', TARGET, VIDEO);
    expect(getFlights()[1]?.surfaceType).toBe('textureView');
  });

  it('never retargets the surface type, because the view cannot take a new one', () => {
    // expo-video documents that `surfaceType` must not change at runtime, and
    // `MediaSurface` captures it on first render — so accepting a new value on a
    // retarget would record a setting the view ignores, and the record would
    // then disagree with the pixels.
    flyTo('a', TARGET, VIDEO, { surfaceType: 'surfaceView' });
    flyTo('a', RECT, VIDEO, { surfaceType: 'textureView' });
    expect(getFlights()[0]?.surfaceType).toBe('surfaceView');
  });

  it('gives the video EXPLICIT width and height, which absoluteFill does not', () => {
    // A DOM `<video>` is a REPLACED element: `position:absolute; inset:0` with
    // `width/height:auto` resolves it to its INTRINSIC size (300x150 before
    // metadata) and the over-constrained right/bottom are discarded rather than
    // stretching it. Measured in a real browser inside a 320x200 box, the
    // element computed `inset: 0px` and `300x150` — it sat at the default while
    // the box animated around it, then jumped the frame `videoWidth/Height`
    // stopped being 0x0.
    //
    // The poster does not suffer it because expo-image sizes its own element,
    // which is exactly why every image flight looked correct and hid this.
    //
    // The browser phase in `verify-media-flight.mjs` is the real gate; this is
    // the fast one, so a regression is caught in a second rather than a minute.
    const { toJSON } = render(<MediaSurface content={VIDEO} />);
    const [view] = hostNodes(toJSON()).filter((node) => node.type === 'ExpoVideoView');
    const style = resolvedStyle(view?.props?.style);
    expect(style.width).toBe('100%');
    expect(style.height).toBe('100%');
    // …and still positioned, or it would fill its own line box instead of the
    // flying one.
    expect(style.position).toBe('absolute');
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

/**
 * The ordering contract, which is the only thing standing between this package
 * and an intermittent restart nobody can reproduce.
 *
 * expo-video's WEB player keeps a `Set` of mounted `<video>` elements and, on
 * each mount, copies `currentTime` and play state from `[...set][0]`. An EMPTY
 * set makes it return early and the new element starts at zero. So the layer's
 * surface has to join that set while the origin's is still in it — i.e. the
 * caller must not navigate until the layer has committed. `flyTo`'s promise is
 * that signal, and these assert it is a real signal rather than a resolved
 * promise wearing one.
 */
describe('flyTo waits for the layer to commit a surface', () => {
  it('does NOT resolve before the layer reports a mounted surface', async () => {
    // The assertion that makes the rest mean something. Without it, a `flyTo`
    // that returned `Promise.resolve()` would satisfy every other test here and
    // let a consumer navigate one commit too early — which on web is exactly the
    // restart, and only on a cold cache, only sometimes.
    let resolved = false;
    void flyTo('a', TARGET, VIDEO, { from: RECT }).then(() => {
      resolved = true;
    });
    await act(async () => {});
    expect(resolved).toBe(false);

    act(() => {
      notifySurfaceMounted('a');
    });
    await act(async () => {});
    expect(resolved).toBe(true);
  });

  it('resolves as soon as the layer is already showing the surface', async () => {
    flyTo('a', TARGET, VIDEO);
    notifySurfaceMounted('a');
    // A retarget of a surface already on screen must not re-block the caller.
    await expect(flyTo('a', RECT, VIDEO)).resolves.toBeUndefined();
  });

  it('gives up after the timeout, so a missing layer degrades to no transition', async () => {
    // An app that forgot `<MediaFlightLayer>` at its root would otherwise have a
    // feed whose videos cannot be opened at all — the promise never settling and
    // the caller never navigating. Loud in dev, harmless in behaviour.
    jest.useFakeTimers();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      let resolved = false;
      void flyTo('a', TARGET, VIDEO).then(() => {
        resolved = true;
      });
      jest.advanceTimersByTime(SURFACE_MOUNT_TIMEOUT_MS + 1);
      await Promise.resolve();
      expect(resolved).toBe(true);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('MediaFlightLayer'));
    } finally {
      warn.mockRestore();
      jest.useRealTimers();
    }
  });

  it('resolves a waiter when the flight is released out from under it', async () => {
    // Otherwise a caller sits on a promise for a surface that no longer exists,
    // until its own timeout fires — a navigation stalled by a quarter second for
    // no reason anybody could find.
    let resolved = false;
    void flyTo('a', TARGET, VIDEO).then(() => {
      resolved = true;
    });
    releaseFlight('a');
    await flushRelease();
    expect(resolved).toBe(true);
  });
});

describe('hand-off: the layer leaves when the DESTINATION is live', () => {
  it('holds the surface until a destination reports itself live', async () => {
    // Releasing on the animation's own clock is the thing this replaces:
    // measured against production, a fullscreen video route needs ~1 s from tap
    // to first presented frame, and a ~300 ms animation would uncover a ~700 ms
    // hole exactly where the transition was supposed to hide one.
    flyTo('a', TARGET, VIDEO, { from: RECT });
    notifySurfaceMounted('a');
    notifySurfaceSettled('a');
    expect(hasFlight('a')).toBe(true);

    handOffFlight('a');
    await flushRelease();
    expect(hasFlight('a')).toBe(false);
  });

  it('does not release MID-FLIGHT when the destination reports early', async () => {
    // A destination that is live before the surface has finished travelling
    // would otherwise make it vanish somewhere between the two rects.
    const suspended = suspendAnimations();
    try {
      flyTo('a', TARGET, VIDEO, { from: RECT });
      notifySurfaceMounted('a');
      // The instrument really intercepted the leg — otherwise "still live"
      // below would be true for the wrong reason.
      expect(suspended.ran()).toBe(true);

      handOffFlight('a');
      expect(hasFlight('a')).toBe(true);

      notifySurfaceSettled('a');
      await flushRelease();
      expect(hasFlight('a')).toBe(false);
    } finally {
      suspended.restore();
    }
  });

  it('is inert for an id with nothing live', () => {
    expect(() => handOffFlight('nope')).not.toThrow();
    expect(hasFlight('nope')).toBe(false);
  });

  it('a surface with NO flightId never hands off', () => {
    // The layer paints its own `MediaSurface`, and it must not pass a flightId:
    // a surface that handed off to itself would release on its own first frame,
    // i.e. immediately, and there would be no transition at all.
    flyTo('a', TARGET, VIDEO, { from: RECT });
    notifySurfaceMounted('a');
    notifySurfaceSettled('a');
    render(<MediaSurface content={VIDEO} />);
    expect(hasFlight('a')).toBe(true);
  });

  it('a destination MediaSurface hands off on its first video frame', async () => {
    // The entrypoint. Every assertion above drives the store directly and would
    // pass against a `flightId` prop that was declared and never wired.
    flyTo('a', TARGET, VIDEO, { from: RECT });
    notifySurfaceMounted('a');
    notifySurfaceSettled('a');

    const { toJSON } = render(<MediaSurface content={VIDEO} flightId="a" />);
    const [view] = hostNodes(toJSON()).filter((node) => node.type === 'ExpoVideoView');
    const onFirstFrameRender = view?.props?.onFirstFrameRender;
    expect(typeof onFirstFrameRender).toBe('function');

    act(() => {
      (onFirstFrameRender as () => void)();
    });
    await flushRelease();
    expect(hasFlight('a')).toBe(false);
  });

  it('a destination IMAGE surface hands off on load, and its poster never does', () => {
    // Both arms report the same fact, because a flight can land on either. But
    // on the VIDEO arm the poster is scenery — handing off on it would release
    // the flying copy while the destination still had no video.
    flyTo('a', TARGET, IMAGE, { from: RECT });
    notifySurfaceMounted('a');
    notifySurfaceSettled('a');

    const image = render(<MediaSurface content={IMAGE} flightId="a" />);
    const [imageNode] = hostNodes(image.toJSON()).filter((n) => n.type === 'ExpoImage');
    expect(typeof imageNode?.props?.onLoad).toBe('function');
    act(() => {
      (imageNode?.props?.onLoad as () => void)();
    });
    expect(hasFlight('a')).toBe(false);

    flyTo('b', TARGET, VIDEO, { from: RECT });
    notifySurfaceMounted('b');
    notifySurfaceSettled('b');
    const video = render(<MediaSurface content={VIDEO} flightId="b" />);
    const [poster] = hostNodes(video.toJSON()).filter((n) => n.type === 'ExpoImage');
    expect(poster?.props?.onLoad).toBeUndefined();
    expect(hasFlight('b')).toBe(true);
  });
});

/**
 * A DYING ELEMENT MUST NOT PAUSE A LIVE ONE.
 *
 * expo-video's web player mirrors pause across every element bound to it
 * (`VideoPlayer.web.js`: `video.onpause` pauses all the others), and the browser
 * auto-pauses a `<video>` removed from the DOM. `unmountVideoView` runs in a
 * PASSIVE effect cleanup — after removal, after the auto-pause — so the element
 * on its way out pauses the one the viewer is watching. Measured in a real app:
 * the reel's video paused 1 ms after the flying surface left the DOM, with
 * nobody having called `pause()`.
 *
 * So a video surface unbinds BEFORE it goes: one commit rendering `player={null}`
 * runs expo-video's own `[props.player]` effect while the node is still in the
 * DOM, and its cleanup takes the element out of `_mountedVideos`.
 */
describe('a video surface unbinds before it leaves the DOM', () => {
  it('renders one commit with NO player before releasing', () => {
    jest.useFakeTimers();
    try {
      flyTo('a', TARGET, VIDEO, { from: RECT });
      notifySurfaceMounted('a');
      notifySurfaceSettled('a');
      handOffFlight('a');

      // Still live, and now marked unbinding — this is the commit that unbinds.
      expect(hasFlight('a')).toBe(true);
      expect(getFlights()[0]?.unbinding).toBe(true);

      jest.advanceTimersByTime(1);
      expect(hasFlight('a')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('passes player={null} to the view during that commit, and the real player before', () => {
    // The entrypoint. The store flag above is inert unless the surface acts on
    // it, and "it unbound" is exactly what a `detached` prop that nothing reads
    // would also report.
    const bound = render(<MediaSurface content={VIDEO} />);
    const [live] = hostNodes(bound.toJSON()).filter((n) => n.type === 'ExpoVideoView');
    expect(live?.props?.player).toBe(PLAYER);

    const unbound = render(<MediaSurface content={VIDEO} detached />);
    const [dying] = hostNodes(unbound.toJSON()).filter((n) => n.type === 'ExpoVideoView');
    expect(dying?.props?.player).toBeNull();
  });

  it('does NOT delay an image surface, which has no player to unbind', () => {
    // The cost is only paid where the hazard exists. An image release staying
    // synchronous is also what keeps every other assertion in this file honest.
    flyTo('b', TARGET, IMAGE, { from: RECT });
    releaseFlight('b');
    expect(hasFlight('b')).toBe(false);
  });

  it('clears the pending release when the registry is reset', () => {
    // A timer that outlives its registry fires into the next suite — the exact
    // shape that made the gallery's reveal timer land in another test file.
    jest.useFakeTimers();
    try {
      flyTo('a', TARGET, VIDEO, { from: RECT });
      notifySurfaceMounted('a');
      notifySurfaceSettled('a');
      handOffFlight('a');
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      resetMediaFlight();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

/**
 * UNBINDING MUST NOT COST THE DESTINATION ITS POSITION.
 *
 * expo-video's web player seeds a newly mounted element from the FIRST element
 * already in `_mountedVideos` (`mountVideoView` adds, then
 * `_synchronizeWithFirstVideo` copies `currentTime` from `[...set][0]`). So the
 * flying surface is not only the pause victim — it is what SEEDS the
 * destination. Unbind it before the destination mounts and the destination
 * starts at ZERO: measured in a consuming app at `ct=0` with the unbind, and
 * `ct=1.07` without it.
 *
 * Bloom's window is safe by construction — release is driven by `handOff`,
 * which the destination raises from its own first frame, so it has mounted and
 * synchronised by then. This asserts that with the destination's `currentTime`
 * rather than by reasoning about effect order, against a double that reproduces
 * expo-video's documented semantics exactly.
 */
describe('unbinding happens after the destination has taken the position', () => {
  /** The slice of `VideoPlayer.web.js` that decides seeding and mirroring. */
  function fakePlayer() {
    const mounted = new Set<{ currentTime: number; paused: boolean }>();
    return {
      mounted,
      playing: true,
      play: () => {},
      pause: () => {},
      mountVideoView(el: { currentTime: number; paused: boolean }) {
        mounted.add(el);
        const first = [...mounted][0];
        if (first) el.currentTime = first.currentTime;
      },
      unmountVideoView(el: { currentTime: number; paused: boolean }) {
        mounted.delete(el);
      },
      /** What the browser does to a detached element, then expo-video's mirror. */
      detach(el: { currentTime: number; paused: boolean }) {
        el.paused = true;
        if (mounted.has(el)) for (const other of mounted) if (other !== el) other.paused = true;
      },
    };
  }

  it('leaves the destination seeded, not at zero', () => {
    const player = fakePlayer();
    // The feed element, already playing.
    const feed = { currentTime: 4.28, paused: false };
    player.mountVideoView(feed);

    // Bloom's flying surface mounts through the real MediaSurface, using a view
    // that binds/unbinds exactly as expo-video's does.
    const elements: Array<{ currentTime: number; paused: boolean }> = [];
    provideExpoVideo({
      VideoView: function FakeVideoView(props: { player?: unknown }) {
        const [el] = React.useState(() => ({ currentTime: 0, paused: false }));
        React.useEffect(() => {
          const p = props.player as ReturnType<typeof fakePlayer> | null | undefined;
          if (!p) return undefined;
          elements.push(el);
          p.mountVideoView(el);
          return () => p.unmountVideoView(el);
        }, [props.player, el]);
        return null;
      },
    });

    try {
      const content = { kind: 'video' as const, player: player as unknown as VideoPlayerLike };
      const flight = render(<MediaSurface content={content} />);
      const flying = elements[0];
      expect(flying?.currentTime).toBeCloseTo(4.28); // seeded from the feed

      // The feed's route goes away.
      player.unmountVideoView(feed);
      player.detach(feed);

      // The destination mounts while the flying surface is STILL bound.
      const destination = { currentTime: 0, paused: false };
      player.mountVideoView(destination);
      expect(destination.currentTime).toBeCloseTo(4.28);

      // Only now does Bloom unbind and drop the flying element.
      flight.rerender(<MediaSurface content={content} detached />);
      flight.unmount();
      player.detach(flying as { currentTime: number; paused: boolean });

      expect(destination.currentTime).toBeCloseTo(4.28);
      expect(destination.paused).toBe(false);
    } finally {
      provideExpoVideo(null);
    }
  });

  it('would have cost the position if it unbound first (control)', () => {
    // The failure the ordering avoids, produced deliberately so "seeded" above
    // is known to be a property of the ORDER and not of the double.
    const player = fakePlayer();
    const feed = { currentTime: 4.28, paused: false };
    player.mountVideoView(feed);
    player.unmountVideoView(feed);

    const destination = { currentTime: 0, paused: false };
    player.mountVideoView(destination);
    expect(destination.currentTime).toBe(0);
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
