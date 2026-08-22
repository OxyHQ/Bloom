/**
 * @jest-environment jsdom
 */

// `BloomColorScope asChild` clones its child with the scope's CSS vars merged
// into `style`, and the SHAPE of that prop is the whole test.
//
// The bug this suite exists for: the merge was always an array — the
// react-native-web form, which RNW flattens. A child that ends on a DOM node
// (an `<a>`, a router `<Link>`, anything forwarding `style` to its host) hands
// that array to React DOM, which walks its own keys and throws
// `Failed to set an indexed property [0] on 'CSSStyleDeclaration'` while
// committing. It took a real page down: every card on oxy.so/newsroom used
// `asChild` around a `<Link>`, so the route rendered blank.
//
// Asserting on the cloned PROP would pass either way round, so this renders
// through React DOM into jsdom and reads the committed element back.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope.web';

// React only treats `act` as a real batching boundary when the environment
// says so; without this every render logs "not configured to support act(...)"
// and assertions run before the commit.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderScoped(child: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BloomColorScope colorPreset="grove" asChild>
          {child}
        </BloomColorScope>
      </BloomThemeProvider>,
    );
  });
  return container;
}

describe('BloomColorScope asChild on web', () => {
  it('commits to a DOM child, keeping the child’s own style and the scope vars', () => {
    const c = renderScoped(<a href="/somewhere" style={{ color: 'rgb(1, 2, 3)' }} />);

    const anchor = c.querySelector('a');
    expect(anchor).not.toBeNull();
    // The child's explicit style wins over the scope's vars…
    expect(anchor?.style.color).toBe('rgb(1, 2, 3)');
    // …and the scope's custom properties are on that same element.
    expect(anchor?.getAttribute('style')).toContain('--');
  });

  it('keeps the array form for a child that is already RN-styled', () => {
    // A react-native-web component's `style` may be an array or a registered
    // style id; flattening it into an object here would corrupt it, so the
    // scope must hand the array through.
    let received: unknown;
    function StyleProbe({ style }: { style?: unknown }) {
      received = style;
      return <div data-testid="probe" />;
    }

    renderScoped(<StyleProbe style={[{ opacity: 0.5 }]} />);

    expect(Array.isArray(received)).toBe(true);
    // Nested, not flattened: react-native-web resolves the nesting itself.
    expect(received).toContainEqual([{ opacity: 0.5 }]);
  });
});
