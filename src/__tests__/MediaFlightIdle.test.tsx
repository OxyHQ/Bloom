/**
 * @jest-environment jsdom
 */

/**
 * WITH NO FLIGHT LIVE, THE LAYER CONTRIBUTES NOTHING TO THE DOM.
 *
 * `<MediaFlightLayer>` is mounted once at an app's root and stays there for the
 * whole life of the process, so for almost all of that life it is idle. If it
 * emits so much as one full-viewport box while idle — and the box is
 * pointer-accepting, which a portaled box under react-native-web becomes very
 * easily — it swallows EVERY tap in the app. Not just media taps: all of them.
 * The app renders perfectly and is completely dead, with nothing in the console.
 *
 * ## Why the flight tests cannot see this
 *
 * `scripts/verify-overlay-stacking.mjs` already has a case asserting the layer
 * does not steal a click, and it passes — because it starts a flight first.
 * This defect exists only when there is NO flight, so every test that begins by
 * flying something is blind to it by construction. That is the shape worth
 * remembering: a suite can cover a component thoroughly and still have a hole
 * exactly where the component spends 99% of its time.
 *
 * ## Why this file mocks react-native to react-native-web, AND the portal to its web fork
 *
 * The repo-wide `react-native` mock renders no host elements at all, so "the
 * layer emitted no DOM" would be true of every component ever written and this
 * file would assert nothing. Against the REAL react-native-web the question
 * becomes the one that matters: what does a browser receive? Same reasoning as
 * `overlay-stack-order.test.tsx`.
 *
 * The portal needs the same treatment, and the POSITIVE CONTROL below is what
 * proved it. `MediaFlightLayer` names `'../portal'`, a neutral specifier, which
 * jest resolves to the NATIVE implementation — and the native `Portal` registers
 * into a context and renders null, so with no `PortalOutlet` mounted the layer
 * emits nothing whether or not a flight is live. Every "it added no element"
 * assertion passed, for a reason that had nothing to do with the property under
 * test, and only the control ("it DOES add elements when flying") failed and
 * gave it away. A browser resolves `portal/index.web`, so that is what this
 * file loads.
 */
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The point is what react-native-web actually emits — see the header.
jest.mock('react-native', () => jest.requireActual('react-native-web'));
// …and what a WEB bundler resolves `'../portal'` to, which is not what jest
// resolves it to. Without this the whole file is vacuous — see the header.
jest.mock('../portal', () => jest.requireActual('../portal/index.web'));

import { MediaFlightLayer } from '../media-flight/MediaFlightLayer';
import { flyTo, releaseFlight, resetMediaFlight } from '../media-flight/store';
import type { MediaSurfaceContent } from '../media-flight/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const IMAGE: MediaSurfaceContent = { uri: 'https://cloud.oxy.so/a.jpg' };
const TARGET = { x: 0, y: 0, width: 400, height: 300 };

function mount(node: ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { root, container };
}

function unmount(mounted: { root: Root; container: HTMLElement }): void {
  act(() => {
    mounted.root.unmount();
  });
  mounted.container.remove();
}

/**
 * Every element the layer put anywhere in the document — its own container AND
 * whatever it portaled elsewhere.
 *
 * Counting only the container would miss the entire defect: the layer renders
 * through a `Portal`, so its output lands somewhere else in `document.body` by
 * design. `bloom-portal-root` is the web fork's container; the native fork's
 * `PortalOutlet` renders inline. Both are covered by walking the whole body and
 * subtracting what was there before.
 */
function bodyElementCount(): number {
  return document.body.querySelectorAll('*').length;
}

/**
 * How many elements live inside the web portal container.
 *
 * The container itself is created lazily and then REUSED for the life of the
 * document, so its existence is not the question — an empty
 * `#bloom-portal-root` is `pointer-events: none` and harmless. What matters is
 * whether the layer parked anything inside it.
 */
function portalChildCount(): number {
  return document.getElementById('bloom-portal-root')?.querySelectorAll('*').length ?? 0;
}

beforeEach(() => {
  resetMediaFlight();
  document.body.innerHTML = '';
});

describe('an idle MediaFlightLayer is not there at all', () => {
  it('adds no element to the document while no flight is live', () => {
    const before = bodyElementCount();
    const mounted = mount(createElement(MediaFlightLayer));
    // The container div itself is this harness's, not the layer's.
    const contributed = bodyElementCount() - before - 1;
    expect(contributed).toBe(0);
    expect(portalChildCount()).toBe(0);
    unmount(mounted);
  });

  it('adds elements once a flight IS live (positive control)', () => {
    // Without this, "the layer added nothing" is also what a layer that can
    // never render anything reports, and the assertion above would survive the
    // component being deleted.
    const before = bodyElementCount();
    const mounted = mount(createElement(MediaFlightLayer));
    act(() => {
      void flyTo('a', TARGET, IMAGE);
    });
    expect(bodyElementCount()).toBeGreaterThan(before + 1);
    unmount(mounted);
  });

  it('goes back to contributing nothing once the flight is released', () => {
    // The other half of the life cycle, and the one that would leave a
    // permanent tap-swallowing box behind after the first video anybody opens.
    const before = bodyElementCount();
    const mounted = mount(createElement(MediaFlightLayer));
    act(() => {
      void flyTo('a', TARGET, IMAGE);
    });
    expect(bodyElementCount()).toBeGreaterThan(before + 1);

    act(() => {
      releaseFlight('a');
    });
    expect(portalChildCount()).toBe(0);
    unmount(mounted);
  });

  it('leaves the element under the pointer reachable while idle', () => {
    // The measurement in the currency of the bug report: what does the browser
    // say is on top? A count of zero elements already implies this, but the
    // report arrived as `elementFromPoint`, and a gate that answers the question
    // as it was asked is the one that will be trusted next time.
    const button = document.createElement('button');
    button.setAttribute('data-testid', 'underneath');
    document.body.appendChild(button);

    const mounted = mount(createElement(MediaFlightLayer));

    // jsdom's `elementFromPoint` is not implemented, so ask the question the
    // way jsdom can answer it: is anything at all layered over the document?
    expect(portalChildCount()).toBe(0);
    expect(document.querySelector('[data-testid="underneath"]')).toBe(button);

    unmount(mounted);
  });
});
