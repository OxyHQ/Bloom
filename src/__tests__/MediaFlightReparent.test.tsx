/**
 * @jest-environment jsdom
 */

/**
 * ONE ELEMENT IDENTITY FOR THE WHOLE FLIGHT.
 *
 * This is the property the two-element architecture could not express, because
 * in it there were ALWAYS two: the origin's element, the flying copy, and the
 * destination's — three, in the case a viewer actually hits. Every earlier test
 * could ask whether the destination ended up in the right place with the right
 * frame. None could ask whether it was the SAME element, and that is the
 * question the pause and the restart both answer to.
 *
 * Measured against the real `VideoPlayerWeb` (expo-video 57.0.2), on one shared
 * player:
 *
 * ```
 * origin dies BEFORE the destination mounts   ct=0      playing   (restarts)
 * origin dies AFTER  the destination mounts   ct=4.28   paused    (freezes)
 * one element, re-parented                    ct=4.28   playing
 * ```
 *
 * So the mechanism's whole claim is element identity, and this file measures
 * exactly that: the same DOM node, connected to the document at every step,
 * from the origin host through the flight and into the destination — while the
 * origin host UNMOUNTS mid-flight, which is what a route change does on web and
 * what every shared-element library assumes never happens.
 *
 * The control is the same story rendered the way it was rendered before: media
 * inside each host. It must report a DIFFERENT element at each stage, or this
 * file is measuring its own harness.
 *
 * ## Why this mocks react-native to react-native-web
 *
 * The repo-wide `react-native` mock renders no host elements, so there would be
 * no DOM node to have an identity. Same reasoning as `MediaFlightIdle`.
 */
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../portal', () => jest.requireActual('../portal/index.web'));

import { MediaFlightLayer } from '../media-flight/MediaFlightLayer.web';
import { MediaFlightHost } from '../media-flight/MediaFlightHost.web';
import { MediaFlightHost as NativeMediaFlightHost } from '../media-flight/MediaFlightHost';
import { provideExpoVideo, type VideoViewLikeProps } from '../media-flight/expo-video-module';
import { resetMediaNodes } from '../media-flight/media-node.web';
import {
  HOST_RANK,
  claimMediaNode,
  getMediaNodes,
  releaseMediaNode,
} from '../media-flight/media-node.web';
import {
  flyTo,
  notifySurfaceSettled,
  registerAnchor,
  resetMediaFlight,
} from '../media-flight/store';
import type { MediaSurfaceContent } from '../media-flight/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PLAYER = { playing: true, play: () => {}, pause: () => {} };
const VIDEO: MediaSurfaceContent = { kind: 'video', player: PLAYER, poster: 'p.jpg' };
const TARGET = { x: 0, y: 0, width: 400, height: 300 };

/** A `VideoView` that renders a real `<video>`, as expo-video's web view does. */
function StoryVideoView(props: VideoViewLikeProps) {
  return createElement('video', {
    'data-testid': 'media',
    'data-detached': props.player == null ? 'yes' : 'no',
  });
}

/** What a host tells the layer to paint. */
const RENDER = {
  content: VIDEO,
  contentFit: 'cover' as const,
  renderVideo: undefined,
  nativeControls: false,
  accessibilityLabel: undefined,
  flightId: undefined,
};

const anchorAt = (rect: typeof TARGET) => ({
  measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
    cb(rect.x, rect.y, rect.width, rect.height),
});

/**
 * Mounted roots, torn down in `afterEach` WHATEVER happened.
 *
 * A failed assertion aborts the test before its own `unmount` calls, and a
 * leaked root keeps rendering into the next test — which is how a first
 * failure here produced a second one that had nothing to do with its own
 * subject (a count of 2 where the layer under test had emitted 1).
 */
const mounted: Array<{ root: Root; container: HTMLElement }> = [];

function mount(node: ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  const entry = { root, container };
  mounted.push(entry);
  return entry;
}

function render(mounted: { root: Root }, node: ReactElement): void {
  act(() => {
    mounted.root.render(node);
  });
}

function unmount(entry: { root: Root; container: HTMLElement }): void {
  const at = mounted.indexOf(entry);
  if (at !== -1) mounted.splice(at, 1);
  act(() => {
    entry.root.unmount();
  });
  entry.container.remove();
}

/** Every media element in the document, wherever it currently lives. */
function mediaElements(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-testid="media"]')];
}

function theMediaElement(): HTMLElement {
  const found = mediaElements();
  // A count assertion here rather than `[0]`: "the same element throughout" is
  // satisfied trivially by reading the first of several.
  expect(found).toHaveLength(1);
  return found[0] as HTMLElement;
}

beforeEach(() => {
  resetMediaFlight();
  resetMediaNodes();
  document.body.innerHTML = '';
  provideExpoVideo({ VideoView: StoryVideoView });
});

afterEach(() => {
  while (mounted.length > 0) {
    const entry = mounted.pop();
    if (entry === undefined) break;
    act(() => {
      entry.root.unmount();
    });
    entry.container.remove();
  }
  provideExpoVideo(null);
});

describe('a re-parented media surface keeps one element for the whole flight', () => {
  it('is the same node in the origin, in flight, and in the destination', () => {
    const layer = mount(createElement(MediaFlightLayer));

    // 1. The origin: a feed row hosting the video.
    const origin = mount(
      createElement(MediaFlightHost, { id: 'v1', content: VIDEO, contentFit: 'cover' }),
    );
    const atOrigin = theMediaElement();
    expect(atOrigin.isConnected).toBe(true);

    // 2. Take off. The layer claims the node and paints it in its own box.
    act(() => {
      registerAnchor('v1', anchorAt({ x: 10, y: 20, width: 100, height: 50 }));
      void flyTo('v1', TARGET, VIDEO);
    });
    const inFlight = theMediaElement();
    expect(inFlight).toBe(atOrigin);
    expect(inFlight.isConnected).toBe(true);

    // 3. The origin route UNMOUNTS mid-flight — the case this layer exists for.
    unmount(origin);
    const afterOriginGone = theMediaElement();
    expect(afterOriginGone).toBe(atOrigin);
    expect(afterOriginGone.isConnected).toBe(true);

    // 4. The destination mounts and claims. That claim IS the hand-off — but
    //    it does NOT take the node yet: the flight outranks every host, or the
    //    media would jump to its landing place while still mid-animation.
    const destination = mount(
      createElement(MediaFlightHost, { id: 'v1', content: VIDEO, contentFit: 'contain' }),
    );
    expect(destination.container.contains(theMediaElement())).toBe(false);

    act(() => {
      notifySurfaceSettled('v1');
    });

    const landed = theMediaElement();
    expect(landed).toBe(atOrigin);
    expect(landed.isConnected).toBe(true);
    // …and it really is inside the destination's box now, not still parked in
    // the layer: "same element" would otherwise be satisfied by never moving.
    expect(destination.container.contains(landed)).toBe(true);

    unmount(destination);
    unmount(layer);
  });

  it('gives a different element at every stage when each host renders its own (control)', () => {
    // The architecture this replaces, run through the same script. If this also
    // reported one identity, the assertions above would be measuring the
    // harness — jsdom reusing a node, a query that finds the same thing twice —
    // rather than the mechanism.
    const layer = mount(createElement(MediaFlightLayer));
    const origin = mount(
      createElement(NativeMediaFlightHost, { id: 'v2', content: VIDEO, contentFit: 'cover' }),
    );
    const atOrigin = theMediaElement();

    act(() => {
      registerAnchor('v2', anchorAt({ x: 10, y: 20, width: 100, height: 50 }));
      void flyTo('v2', TARGET, VIDEO);
    });
    // Two now: the origin's own, and the flying copy the layer painted.
    expect(mediaElements()).toHaveLength(2);

    unmount(origin);
    const flying = theMediaElement();
    expect(flying).not.toBe(atOrigin);

    const destination = mount(
      createElement(NativeMediaFlightHost, {
        id: 'v2',
        content: VIDEO,
        contentFit: 'contain',
        flightId: 'v2',
      }),
    );
    const landed = mediaElements().find((el) => destination.container.contains(el));
    expect(landed).toBeDefined();
    expect(landed).not.toBe(atOrigin);
    expect(landed).not.toBe(flying);

    unmount(destination);
    unmount(layer);
  });

  it('parks a node between hosts IN the document, where it cannot be paused', () => {
    // A detached `<video>` is auto-paused by the browser, so "no host right
    // now" has to mean somewhere invisible rather than nowhere at all. This is
    // the gap between an origin host unmounting and the layer's own claim
    // committing — one frame, and the frame the whole feature happens in.
    //
    // Driven through the registry rather than through React because the gap is
    // exactly what `act()` closes: mounting the layer would have it claim in
    // the same commit, and there would be no gap to observe.
    const host = document.createElement('div');
    document.body.appendChild(host);
    claimMediaNode('p1', host, HOST_RANK, RENDER);
    const wrapper = document.querySelector('[data-bloom-media-node]');
    expect(host.contains(wrapper)).toBe(true);

    act(() => {
      registerAnchor('p1', anchorAt({ x: 0, y: 0, width: 10, height: 10 }));
      void flyTo('p1', TARGET, VIDEO);
    });
    releaseMediaNode('p1', host, HOST_RANK);

    expect(wrapper?.isConnected).toBe(true);
    expect(document.getElementById('bloom-media-holder')?.contains(wrapper)).toBe(true);
    // …and the layer is still told to paint it. A parked node dropped from the
    // snapshot would lose its element to React, which is the removal this
    // module exists to avoid, in the one frame it matters.
    expect(getMediaNodes().map((node) => node.id)).toContain('p1');
  });

  it('disposes a node nothing is going to want back (control)', () => {
    // The same release with NO flight live. Without this, "it parked" is also
    // what a registry that never cleans anything up reports — and a media node
    // that outlives its last host holds a decoder for the life of the tab.
    const host = document.createElement('div');
    document.body.appendChild(host);
    claimMediaNode('p2', host, HOST_RANK, RENDER);
    const wrapper = document.querySelector('[data-bloom-media-node]');
    expect(wrapper).not.toBeNull();

    releaseMediaNode('p2', host, HOST_RANK);

    expect(wrapper?.isConnected).toBe(false);
    expect(document.querySelector('[data-bloom-media-node]')).toBeNull();
  });

  it('never binds two elements to one player, at any point in the sequence', () => {
    // The property the pause and the restart both come from: expo-video's web
    // player mirrors pause across every element bound to it and seeds a new one
    // from the first. With one element there is nothing to mirror and nothing
    // to seed — but only if there is never, at any instant, a second.
    const layer = mount(createElement(MediaFlightLayer));
    const counts: number[] = [];
    const sample = () => counts.push(mediaElements().length);

    const origin = mount(createElement(MediaFlightHost, { id: 'v4', content: VIDEO }));
    sample();
    act(() => {
      registerAnchor('v4', anchorAt({ x: 0, y: 0, width: 10, height: 10 }));
      void flyTo('v4', TARGET, VIDEO);
    });
    sample();
    const destination = mount(createElement(MediaFlightHost, { id: 'v4', content: VIDEO }));
    sample();
    unmount(origin);
    sample();
    act(() => {
      notifySurfaceSettled('v4');
    });
    sample();

    expect(counts).toEqual([1, 1, 1, 1, 1]);

    unmount(destination);
    unmount(layer);
  });
});

describe('a host that paints its own video keeps the same node too', () => {
  it('re-parents the CONSUMER’s element across the route change', () => {
    // The slot exists so a consumer can keep its `ref` and expo-video's
    // picture-in-picture props. If re-parenting only worked for the element
    // Bloom builds, the slot would be a way to opt OUT of the whole feature —
    // and the consuming app needs both at once.
    const layer = mount(createElement(MediaFlightLayer));
    const renderVideo = (props: { player: unknown }) =>
      createElement('video', {
        'data-testid': 'media',
        'data-consumer': 'yes',
        'data-detached': props.player == null ? 'yes' : 'no',
      });

    const origin = mount(
      createElement(MediaFlightHost, { id: 'v5', content: VIDEO, renderVideo }),
    );
    const atOrigin = theMediaElement();
    expect(atOrigin.dataset.consumer).toBe('yes');

    act(() => {
      registerAnchor('v5', anchorAt({ x: 0, y: 0, width: 10, height: 10 }));
      void flyTo('v5', TARGET, VIDEO);
    });
    unmount(origin);

    const destination = mount(
      createElement(MediaFlightHost, { id: 'v5', content: VIDEO, renderVideo }),
    );
    act(() => {
      notifySurfaceSettled('v5');
    });

    expect(theMediaElement()).toBe(atOrigin);
    expect(destination.container.contains(atOrigin)).toBe(true);

    unmount(destination);
    unmount(layer);
  });
});

describe('the idle layer still contributes nothing', () => {
  it('renders no element with neither a flight nor a host', () => {
    // The web fork now has a second reason to render (shared nodes), so the
    // idle property has to be re-established for it — `MediaFlightIdle` covers
    // the neutral module only.
    const before = document.body.querySelectorAll('*').length;
    const layer = mount(createElement(MediaFlightLayer));
    expect(document.body.querySelectorAll('*').length - before - 1).toBe(0);
    unmount(layer);
  });
});
