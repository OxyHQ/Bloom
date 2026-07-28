/**
 * @jest-environment jsdom
 */

// The bug these tests exist for: Bloom's web `Portal` root is
// `pointer-events: none`, so every portaled surface has to opt back in. The
// surfaces did that with a `style={{ pointerEvents: 'box-none' }}` entry, which
// never reached the DOM — react-native-web resolves the `pointerEvents` PROP
// into its class pair, and the style-object form was dropped on the way
// through. The result on production web: dialogs, bottom sheets, the image
// viewer and toasts all rendered perfectly and were completely click-through.
// Backdrops didn't dismiss, panels didn't press, and clicks landed on the app
// behind the overlay.
//
// `OverlayRoot` / `Backdrop` encode the working contract; these tests pin it.

import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The whole point is what react-native-web puts in the DOM, so this suite runs
// against the REAL RNW — not the repo-wide `react-native` mock, which never
// emits a class and would make every assertion below vacuous.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Backdrop, OverlayRoot } from '../overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/** Every `pointer-events` declaration react-native-web injected for `className`. */
function pointerEventsRulesFor(className: string): string[] {
  const classes = className.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      const text = rule.cssText ?? '';
      if (!text.includes('pointer-events')) continue;
      if (classes.some((c) => text.includes(`.${c}`))) out.push(text);
    }
  }
  return out;
}

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

describe('overlay pointer-events contract (web)', () => {
  it('OverlayRoot emits box-none: itself inert, its children interactive', () => {
    const { root, container } = render(
      createElement(OverlayRoot, { testID: 'root', children: null }),
    );

    const el = container.querySelector('[data-testid="root"]');
    expect(el).not.toBeNull();
    const rules = pointerEventsRulesFor(el?.className ?? '');

    // The two halves of react-native-web's `box-none`: the box itself does not
    // take events (empty gaps stay click-through), direct children do.
    expect(rules.some((r) => /pointer-events:\s*none/.test(r) && !/>\s*\*/.test(r))).toBe(true);
    expect(rules.some((r) => />\s*\*/.test(r) && /pointer-events:\s*auto/.test(r))).toBe(true);

    act(() => root.unmount());
    container.remove();
  });

  it('Backdrop takes pointer events and dismisses on press', () => {
    const onPress = jest.fn();
    const { root, container } = render(
      createElement(Backdrop, { onPress, testID: 'backdrop' }),
    );

    const el = container.querySelector('[data-testid="backdrop"]') as HTMLElement | null;
    expect(el).not.toBeNull();

    // Without this the element inherits the portal root's `none` and the press
    // below can never happen in a real browser.
    expect(
      pointerEventsRulesFor(el?.className ?? '').some((r) =>
        /pointer-events:\s*auto/.test(r),
      ),
    ).toBe(true);

    act(() => {
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    container.remove();
  });

  // Every Bloom surface dims the app the same way: the blur is part of the
  // shared backdrop, not something each surface opts into (it used to be — the
  // image viewer blurred, dialogs and sheets only dimmed).
  it('blurs by default and drops the blur layer only when asked', () => {
    const withBlur = render(createElement(Backdrop, { onPress: () => {}, testID: 'a' }));
    expect(withBlur.container.getElementsByTagName('blurview').length).toBe(1);
    act(() => withBlur.root.unmount());
    withBlur.container.remove();

    const noBlur = render(
      createElement(Backdrop, { onPress: () => {}, blurIntensity: 0, testID: 'b' }),
    );
    expect(noBlur.container.getElementsByTagName('blurview').length).toBe(0);
    act(() => noBlur.root.unmount());
    noBlur.container.remove();
  });

  // THE fade invariant. `backdrop-filter` samples nothing under an ancestor
  // that composites in isolation, so an opacity anywhere above the blur layer
  // silently removes the blur — which is exactly what a surface fading the
  // backdrop from the outside used to do. A caller's `opacity` is therefore
  // redirected onto the layers and the press target stays fully opaque.
  it('keeps the press target opaque and fades the layers instead', () => {
    const { root, container } = render(
      createElement(Backdrop, { onPress: () => {}, testID: 'backdrop', style: { opacity: 0.4 } }),
    );

    const el = container.querySelector('[data-testid="backdrop"]') as HTMLElement;
    const inline = el.style.opacity;
    const opacity = Number(inline === '' ? getComputedStyle(el).opacity || '1' : inline);

    // The press target itself never fades — the blur under it would go with it.
    expect(opacity).toBe(1);
    // …and the layers it fades instead are there to receive it. (Their opacity
    // is written by reanimated, which this suite mocks, so the value itself is
    // asserted in the browser rather than here.)
    expect(el.children.length).toBeGreaterThanOrEqual(2);

    act(() => root.unmount());
    container.remove();
  });

  it('a disabled Backdrop dims without dismissing', () => {
    const onPress = jest.fn();
    const { root, container } = render(
      createElement(Backdrop, { onPress, disabled: true, testID: 'backdrop' }),
    );

    const el = container.querySelector('[data-testid="backdrop"]') as HTMLElement | null;
    act(() => {
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).not.toHaveBeenCalled();

    act(() => root.unmount());
    container.remove();
  });
});
