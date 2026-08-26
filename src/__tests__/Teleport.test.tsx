/**
 * @jest-environment jsdom
 */

/**
 * THE VENDORED react-native-teleport, exercised on the path Bloom uses.
 *
 * `src/teleport/` is a copy of react-native-teleport 1.2.0 (MIT, Copyright (c)
 * 2025 Kiryl Ziusko — see `NOTICE`). Their own suite comes with it and is NOT
 * yet in this repo: it is written for `preset: react-native`, where these
 * components resolve to Fabric views, and Bloom's jest has no platform
 * extensions, so it resolves the bare files — which in their layout are the WEB
 * ones. Rendered by `@testing-library/react-native` those hit react-dom's
 * `createPortal` inside a `react-test-renderer` tree and fail on an unrelated
 * incompatibility. Their tests are held until that is decided rather than
 * skipped, because a skipped vendored test is a claim of coverage that is not
 * there.
 *
 * This is what can be asserted today, with react-dom, which is what a browser
 * uses: the copy is wired up and the teleport actually moves a node.
 */
import { act, createElement, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Portal, PortalHost, PortalProvider } from '../teleport';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function mount(node: ReactElement): void {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(node);
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  document.body.innerHTML = '';
});

/** A host, a portal, and a button that sends the portal to the host. */
function Demo() {
  const [hostName, setHostName] = useState<string | undefined>(undefined);
  return createElement(
    PortalProvider,
    null,
    createElement('button', { 'data-testid': 'send', onClick: () => setHostName('far') }, 'send'),
    createElement('div', { 'data-testid': 'local' },
      createElement(Portal, { hostName, name: 'p' },
        createElement('div', { 'data-testid': 'travelling' }))),
    createElement('div', { 'data-testid': 'far-wrapper' },
      createElement(PortalHost, { name: 'far' })),
  );
}

const travelling = () => document.querySelector('[data-testid="travelling"]');
const inside = (testId: string) =>
  document.querySelector(`[data-testid="${testId}"]`)?.contains(travelling()) ?? false;

describe('the vendored react-native-teleport', () => {
  it('renders its children where they were declared until a host is named', () => {
    mount(createElement(Demo));
    expect(travelling()).not.toBeNull();
    expect(inside('local')).toBe(true);
    expect(inside('far-wrapper')).toBe(false);
  });

  it('MOVES the same node to the host, rather than rebuilding it there', () => {
    // The whole reason it is vendored. Node identity, not a snapshot: a portal
    // that unmounted and remounted its children would satisfy "it is in the
    // host" while losing exactly what Bloom needs it for.
    mount(createElement(Demo));
    const before = travelling();
    act(() => {
      document.querySelector<HTMLElement>('[data-testid="send"]')?.click();
    });
    expect(travelling()).toBe(before);
    expect(inside('far-wrapper')).toBe(true);
    expect(inside('local')).toBe(false);
  });

  it('takes the children with it when its OWNER unmounts (their model, measured)', () => {
    // Not a defect, and the reason Bloom mounts these portals from its root
    // layer instead of from the origin screen: `<Portal>` renders
    // `createPortal(children, …)` INSIDE the component that mounts it, so the
    // children belong to that component's tree. Measured in a browser against
    // the same library: origin unmounted -> `count 1 -> 0 -> 0`.
    function Owned({ show }: { show: boolean }) {
      return createElement(
        PortalProvider,
        null,
        show
          ? createElement(Portal, { hostName: 'far', name: 'p' },
              createElement('div', { 'data-testid': 'travelling' }))
          : null,
        createElement('div', { 'data-testid': 'far-wrapper' },
          createElement(PortalHost, { name: 'far' })),
      );
    }
    mount(createElement(Owned, { show: true }));
    expect(travelling()).not.toBeNull();
    act(() => {
      root?.render(createElement(Owned, { show: false }));
    });
    expect(travelling()).toBeNull();
  });
});
