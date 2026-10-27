/**
 * @jest-environment jsdom
 *
 * `AutoHideBar` through the real react-native-web: what is hidden is inert and
 * out of the accessibility tree, the strip is a named button, and the body is
 * laid out once per change (the FLIP's first frame, then its slide home).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AutoHideBar } from '../layout/AutoHideBar';
import type { AutoHideBarProps } from '../layout/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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

function render(props: Partial<AutoHideBarProps>) {
  act(() =>
    root.render(
      <BloomThemeProvider>
        <AutoHideBar
          testID="ahb"
          collapsed={false}
          bar={<button type="button">Back</button>}
          summary="example.com"
          {...props}
        >
          <p>Page</p>
        </AutoHideBar>
      </BloomThemeProvider>,
    ),
  );
}
const byTest = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

it('shows the bar and hides the strip from assistive technology while shown', () => {
  render({});
  const controls = byTest('ahb-controls');
  expect(controls.hasAttribute('inert')).toBe(false);
  expect(controls.getAttribute('aria-hidden')).toBeNull();
  const strip = byTest('ahb-strip').parentElement!;
  expect(strip.hasAttribute('inert')).toBe(true);
  expect(strip.getAttribute('aria-hidden')).toBe('true');
  expect(byTest('ahb-body').style.top).toBe('41px');
});

it('collapsed: the controls are inert and hidden, the strip is a named button', () => {
  render({ collapsed: true });
  const controls = byTest('ahb-controls');
  expect(controls.hasAttribute('inert')).toBe(true);
  expect(controls.getAttribute('aria-hidden')).toBe('true');
  const button = byTest('ahb-strip');
  expect(button.getAttribute('role')).toBe('button');
  expect(button.getAttribute('aria-label')).toBe('Show toolbar');
  expect(button.textContent).toBe('example.com');
  expect(byTest('ahb-body').style.top).toBe('20px');
});

it('a label prop wins over the catalog, and pressing the strip asks to reveal', () => {
  const onReveal = jest.fn();
  render({ collapsed: true, onReveal, revealLabel: 'Show address bar' });
  const button = byTest('ahb-strip');
  expect(button.getAttribute('aria-label')).toBe('Show address bar');
  act(() => button.click());
  expect(onReveal).toHaveBeenCalledTimes(1);
});

it('lays the body out tall at once on collapse, then slides it home without a relayout', () => {
  render({});
  const body = byTest('ahb-body');
  render({ collapsed: true });
  // Layout committed once at the strip; the translate (FLIP) ends at zero.
  expect(body.style.top).toBe('20px');
  expect(body.style.transform).toMatch(/translateY\(0(px)?\)/);
  expect(body.style.transitionProperty).toBe('transform');
  // Expanding keeps the tall layout and slides down by the room…
  render({ collapsed: false });
  expect(body.style.top).toBe('20px');
  expect(body.style.transform).toMatch(/translateY\(21px\)/);
  // …and commits the short layout once the slide has ended.
  act(() => {
    const event = new Event('transitionend', { bubbles: true }) as Event & {
      propertyName?: string;
    };
    event.propertyName = 'transform';
    body.dispatchEvent(event);
  });
  expect(body.style.top).toBe('41px');
  expect(body.style.transform).toMatch(/translateY\(0(px)?\)/);
});

it('drives the bar with CSS transitions, not per-frame styles', () => {
  render({ collapsed: true });
  const controls = byTest('ahb-controls').firstElementChild as HTMLElement;
  expect(controls.style.transitionProperty).toBe('transform');
  expect(controls.style.transitionDuration).toBe('150ms');
  expect(controls.style.transform).toContain('scale(0.94)');
  expect(controls.style.getPropertyValue('--bloom-surface-presence')).toBe('0');
});
