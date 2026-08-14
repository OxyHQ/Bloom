/**
 * @jest-environment jsdom
 */

/**
 * The overlay stacking rule: a surface opened LATER paints above one opened
 * earlier.
 *
 * Jest cannot see the bug this guards — the losing surface renders perfectly
 * and its styles are all valid; it is simply painted underneath. So these tests
 * pin the two halves Jest CAN decide:
 *
 *   1. the authority in `src/overlay/stack.ts` hands out ascending depths, and
 *      keeps doing so across the interleavings that actually occur;
 *   2. every overlay surface in `src/` gets its depth FROM that authority
 *      rather than from a constant of its own — the property whose absence
 *      caused the bug in the first place.
 *
 * The hit test that proves the user-visible outcome lives in
 * `scripts/verify-overlay-stacking.mjs`, driven against a real browser.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The point of the DOM half is what react-native-web actually emits, so it runs
// against the REAL RNW — the repo-wide `react-native` mock renders no host
// elements and would make every depth assertion below vacuous.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { OverlayRoot } from '../overlay';
import {
  acquireOverlayRank,
  layerForRank,
  OVERLAY_STACK_BASE,
  OVERLAY_STACK_MAX_RANK,
  registerOverlayRank,
  releaseOverlayRank,
  resetOverlayStack,
  TOAST_LAYER_Z,
} from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  resetOverlayStack();
});

describe('the stacking authority', () => {
  it('gives a later opener a higher depth than an earlier one', () => {
    const first = layerForRank(acquireOverlayRank());
    const second = layerForRank(acquireOverlayRank());
    const third = layerForRank(acquireOverlayRank());

    expect(second.root).toBeGreaterThan(first.root);
    expect(third.root).toBeGreaterThan(second.root);
  });

  it('puts a surface above its OWN backdrop without reaching the next surface', () => {
    const lower = layerForRank(acquireOverlayRank());
    const upper = layerForRank(acquireOverlayRank());

    expect(lower.surface).toBeGreaterThan(lower.backdrop);
    // The band is what keeps a surface's own parts from colliding with the
    // floor of the surface above it.
    expect(lower.surface).toBeLessThan(upper.backdrop);
  });

  it('keeps ordering when surfaces close out of order', () => {
    // A opens, B opens, A closes, C opens. C is newest and must outrank B.
    const a = acquireOverlayRank();
    registerOverlayRank(a);
    const b = acquireOverlayRank();
    registerOverlayRank(b);

    releaseOverlayRank(a);

    const c = acquireOverlayRank();
    registerOverlayRank(c);

    expect(layerForRank(c).root).toBeGreaterThan(layerForRank(b).root);
  });

  it('starts over once every surface has closed, so depths stay small', () => {
    const a = acquireOverlayRank();
    registerOverlayRank(a);
    releaseOverlayRank(a);

    expect(layerForRank(acquireOverlayRank()).root).toBe(layerForRank(a).root);
  });

  it('cannot lose a rank handed out but not yet registered', () => {
    // The one interleaving the reset could otherwise break: a surface takes a
    // rank during render, and before its effect registers it the last open
    // surface unmounts and resets the counter. The newcomer must still land
    // ABOVE the one that is on its way up.
    const open = acquireOverlayRank();
    registerOverlayRank(open);

    const rendering = acquireOverlayRank(); // taken, effect not run yet
    releaseOverlayRank(open); // live set empties -> reset
    registerOverlayRank(rendering); // effect finally runs

    const next = acquireOverlayRank();
    expect(next).toBeGreaterThan(rendering);
    expect(layerForRank(next).root).toBeGreaterThan(layerForRank(rendering).root);
  });

  it('saturates instead of climbing into the toast layer', () => {
    const runaway = layerForRank(OVERLAY_STACK_MAX_RANK + 5_000);
    expect(runaway.surface).toBeLessThan(TOAST_LAYER_Z);
    expect(runaway.root).toBe(layerForRank(OVERLAY_STACK_MAX_RANK).root);
  });

  it('keeps every rank below the toast layer', () => {
    // Toasts are notifications, not modal surfaces: they stay visible over
    // whatever is open, including a surface opened after them.
    expect(layerForRank(1).root).toBeGreaterThanOrEqual(OVERLAY_STACK_BASE);
    expect(layerForRank(OVERLAY_STACK_MAX_RANK).surface).toBeLessThan(TOAST_LAYER_Z);
  });
});

describe('OverlayRoot', () => {
  function render(node: ReturnType<typeof createElement>): {
    root: Root;
    container: HTMLElement;
  } {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(node);
    });
    return { root, container };
  }

  const depthOf = (container: HTMLElement, testID: string) => {
    const el = container.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
    if (!el) throw new Error(`no element with testID ${testID}`);
    return Number(getComputedStyle(el).zIndex);
  };

  it('paints a surface mounted later above one mounted earlier', () => {
    const first = render(createElement(OverlayRoot, { testID: 'first', children: null }));
    const second = render(createElement(OverlayRoot, { testID: 'second', children: null }));

    const firstZ = depthOf(first.container, 'first');
    const secondZ = depthOf(second.container, 'second');

    // Vacuity floor: both must have emitted a real depth, or "second > first"
    // would be comparing two NaNs into a silent pass.
    expect(Number.isFinite(firstZ)).toBe(true);
    expect(Number.isFinite(secondZ)).toBe(true);
    expect(secondZ).toBeGreaterThan(firstZ);

    act(() => {
      first.root.unmount();
      second.root.unmount();
    });
    first.container.remove();
    second.container.remove();
  });

  it('pins to the given depth, and takes no rank, when told to', () => {
    const pinned = render(
      createElement(OverlayRoot, { testID: 'pinned', zIndex: TOAST_LAYER_Z, children: null }),
    );
    expect(depthOf(pinned.container, 'pinned')).toBe(TOAST_LAYER_Z);

    // Having opted out, it must not have consumed a rank either — the next
    // surface to open is still the FIRST one in the stack.
    const ranked = render(createElement(OverlayRoot, { testID: 'ranked', children: null }));
    expect(depthOf(ranked.container, 'ranked')).toBe(layerForRank(1).root);

    act(() => {
      pinned.root.unmount();
      ranked.root.unmount();
    });
    pinned.container.remove();
    ranked.container.remove();
  });
});

describe('no surface picks its own depth', () => {
  const SRC = path.join(__dirname, '..');
  const read = (rel: string) => readFileSync(path.join(SRC, rel), 'utf8');

  /**
   * Every file in `src/` that presents an overlay surface. Enumerated
   * explicitly rather than globbed: a glob that silently stops matching is the
   * shape of check that passes forever while covering nothing.
   */
  const SURFACES = [
    'dialog/Dialog.tsx',
    'dialog/Dialog.web.tsx',
    'bottom-sheet/index.web.tsx',
    'menu/index.web.tsx',
    'select/index.web.tsx',
    'context-menu/index.web.tsx',
    'popover/index.web.tsx',
    'tooltip/index.tsx',
    'zoomable-image-gallery/ZoomableImageGallery.tsx',
    'prompt-input/PromptInputBase.tsx',
    'avatar-group/AvatarGroup.web.tsx',
    'toast/ToastHost.tsx',
  ];

  /** Strips comments, so prose ABOUT the old constants never trips the scan. */
  const code = (rel: string) =>
    read(rel)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

  it.each(SURFACES)('%s claims no overlay-ordering constant', (rel) => {
    const body = code(rel);

    // The rungs that used to decide which SURFACE was on top. Their absence is
    // the property that makes open order the only authority.
    expect(body).not.toMatch(
      /Z_INDEX\.(overlayBackdrop|overlaySurface|dropdownSurface|tooltip|toast|fullscreen|fullscreenControl|portalRoot)\b/,
    );
    expect(body).not.toMatch(/createOverlayZIndex|createDropdownZIndex|Z_INDEX_LAYER_STEP/);
  });

  it('the scale no longer offers an overlay-ordering rung to reach for', () => {
    const scale = code('styles/z-index.ts');
    for (const gone of [
      'overlayBackdrop',
      'overlaySurface',
      'dropdownSurface',
      'tooltip',
      'toast',
      'fullscreen',
      'fullscreenControl',
      'createOverlayZIndex',
      'createDropdownZIndex',
      'Z_INDEX_LAYER_STEP',
    ]) {
      expect(scale).not.toContain(gone);
    }
    // Vacuity floor: the module must still export the within-context scale, or
    // the loop above would pass against an empty file.
    expect(scale).toMatch(/export const Z_INDEX = \{/);
    expect(scale).toMatch(/portalRoot: 999999/);
  });

  it('the WEB tooltip is deliberately NOT in this list', () => {
    // It is the one tooltip that is not portaled: the bubble is absolutely
    // positioned against its own trigger and renders inline, so it cannot be
    // lifted over another surface and has no rank to take. The NATIVE tooltip
    // does portal, and IS in the list above. If this ever starts portaling,
    // move it into `SURFACES`.
    expect(code('tooltip/index.web.tsx')).not.toMatch(/from '\.\.\/portal/);
    expect(code('tooltip/index.tsx')).toMatch(/from '\.\.\/portal/);
  });

  it('every surface routes its depth through OverlayRoot', () => {
    // `Dialog.web`'s side placement renders `SheetSurface`, which mounts its
    // own `OverlayRoot`; the centred branch mounts one directly. Both files are
    // covered by the membership check below.
    const missing = SURFACES.filter((rel) => !code(rel).includes('OverlayRoot'));
    expect(missing).toEqual([]);
    // Vacuity floor on the list itself.
    expect(SURFACES.length).toBeGreaterThanOrEqual(12);
  });
});
