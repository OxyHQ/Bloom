/**
 * @jest-environment jsdom
 */

// `BloomProvider` exists so an app mounts ONE Bloom root instead of five, and
// the concrete bug that motivated it is web-only: `useScrollRestoration()`
// THROWS outside `ScrollRestorationProvider`, so anything scrollable that an
// app renders beside — rather than under — that provider crashes the screen.
//
// The provider itself is platform-agnostic (it holds a store and a router
// adapter), so no platform mapping is needed here: the hook under test is
// imported from the web barrel, and it reads the very context the provider
// mounts. What BloomProvider still supplies — and what these tests assert
// reaches the subtree — is the expo-router ADAPTER.

import { createElement, type ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Only the two navigation hooks `scroll/expo-router` consumes; `virtual` keeps the
// real (native-heavy) expo-router off the resolver.
jest.mock(
  'expo-router',
  () => {
    const react = jest.requireActual<typeof import('react')>('react');
    return {
      useFocusEffect: (effect: () => undefined | (() => void)) => {
        react.useEffect(effect, [effect]);
      },
      useRoute: () => ({ key: 'route-test', name: 'Test', params: {} }),
    };
  },
  { virtual: true },
);

// Imported AFTER the mock is registered.
import { BloomProvider } from '../provider';
import { useImageResolver } from '../image-resolver';
import { useScrollRestoration } from '../scroll/index.web';

/**
 * Stands in for any Bloom-consuming scrollable an app renders under the root —
 * a feed, a right-rail replies list, an overlay.
 */
function Scrollable({ onResolve }: { onResolve?: (url: string | undefined) => void }): ReactNode {
  useScrollRestoration('window');
  const resolver = useImageResolver();
  onResolve?.(resolver?.('file-id', 'avatar'));
  return null;
}

function render(node: ReactNode): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { root, container };
}

function unmount({ root, container }: { root: Root; container: HTMLElement }): void {
  act(() => {
    root.unmount();
  });
  container.remove();
}

describe('BloomProvider (web)', () => {
  it('provides scroll restoration to everything below it', () => {
    let resolved: string | undefined;
    let mounted: { root: Root; container: HTMLElement } | undefined;

    expect(() => {
      mounted = render(
        createElement(BloomProvider, {
          fonts: false,
          imageResolver: (id: string, variant?: string) => `${id}:${variant}`,
          children: createElement(Scrollable, { onResolve: (url) => { resolved = url; } }),
        }),
      );
    }).not.toThrow();

    // The image resolver reaches the same subtree — one root, every context.
    expect(resolved).toBe('file-id:avatar');

    if (mounted) unmount(mounted);
  });

  // Vacuity guard: proves the assertion above is actually load-bearing. If the
  // provider ever stops mounting the WEB scroll provider (a bad platform
  // binding, a dropped nesting level) this control case is what makes the test
  // above meaningful — remove the provider and the very same child throws.
  it('is what keeps the hook from throwing — the same child crashes without it', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(() => render(createElement(Scrollable, {}))).toThrow(
        /useScrollRestoration must be used within a <ScrollRestorationProvider>/,
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
