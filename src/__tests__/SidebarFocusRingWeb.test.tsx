/**
 * @jest-environment jsdom
 *
 * Every sidebar control on web shows a keyboard focus ring. The ring is ONE
 * stylesheet rule — `[data-bloom-sidebar]:focus-visible` paints
 * `var(--bloom-sidebar-ring)` — so a control carrying the hook but not the
 * variable matches the rule and paints nothing: the collapse button shipped
 * exactly that way, focusable and invisible while focused. Rendered through
 * react-native-web, so these are the real DOM attributes and inline styles.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiHomeLine } from '../icons/remix';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
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

const ITEMS = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/home' }];

function render(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

/** The ring colour a hooked control resolves: its own, or an ancestor's. */
function ringOf(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const value = (node as HTMLElement).style?.getPropertyValue('--bloom-sidebar-ring');
    if (value) return value.trim();
  }
  return '';
}

function hooked(): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-bloom-sidebar]'));
}

describe('Sidebar focus ring (web)', () => {
  it('gives the collapse button a ring colour', () => {
    render(<Sidebar items={ITEMS} />);
    const collapse = container.querySelector('[data-testid="sidebar-collapse"]');
    expect(collapse?.getAttribute('data-bloom-sidebar')).toBe('ring');
    expect(ringOf(collapse!)).not.toBe('');
  });

  it('gives the mobile close button a ring colour', () => {
    render(<Sidebar items={ITEMS} mobile onClose={() => undefined} />);
    const close = container.querySelector('[data-testid="sidebar-close"]');
    expect(close?.getAttribute('data-bloom-sidebar')).toBe('ring');
    expect(ringOf(close!)).not.toBe('');
  });

  it.each([
    ['panel', {}],
    ['mobile', { mobile: true, onClose: (): void => undefined }],
    ['flat mobile with search', { mobile: true, surface: 'plain' as const, showSearch: true, onClose: (): void => undefined }],
  ])('leaves no hooked control without a ring colour (%s)', (_name, props) => {
    render(<Sidebar items={ITEMS} {...props} />);
    const controls = hooked();
    expect(controls.length).toBeGreaterThan(1);
    const bare = controls.filter((element) => ringOf(element) === '');
    expect(bare.map((element) => element.getAttribute('aria-label') ?? element.textContent)).toEqual([]);
  });
});
