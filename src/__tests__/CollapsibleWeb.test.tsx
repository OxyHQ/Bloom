/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}));
import { Collapsible } from '../collapsible/Collapsible.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement, root: Root;
let resize: () => void;
let naturalHeight = 900;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.ResizeObserver = class {
    constructor(fn: () => void) {
      resize = fn;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      height: this.classList.contains('bloom-collapsible-content') ? naturalHeight : 0,
    } as DOMRect;
  });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  naturalHeight = 900;
});
it('measures arbitrary content, retains its state and hides closed descendants without inventing a region', () => {
  const draw = (open: boolean) =>
    act(() =>
      root.render(
        <Collapsible
          open={open}
          testID="body"
          className="custom-shell"
          contentClassName="custom-body"
          contentStyle={{ padding: 18 }}
        >
          <input defaultValue="Saved" />
        </Collapsible>,
      ),
    );
  draw(false);
  const panel = container.querySelector<HTMLElement>('[data-testid=body]')!;
  const input = container.querySelector<HTMLInputElement>('input')!;
  input.value = 'Edited';
  expect(panel.hasAttribute('inert')).toBe(true);
  expect(panel.getAttribute('aria-hidden')).toBe('true');
  expect(panel.hasAttribute('role')).toBe(false);
  expect(panel.hasAttribute('aria-labelledby')).toBe(false);
  draw(true);
  expect(panel.hasAttribute('inert')).toBe(false);
  expect(panel.style.maxHeight).toBe('900px');
  expect(container.querySelector('.custom-body')?.getAttribute('style')).toContain('padding: 18px');
  naturalHeight = 1300;
  act(() => resize());
  expect(panel.style.maxHeight).toBe('1300px');
  draw(false);
  expect(parseFloat(panel.style.maxHeight)).toBe(0);
  draw(true);
  expect(container.querySelector('input')).toBe(input);
  expect(input.value).toBe('Edited');
});
it('returns contained focus to the supplied host, but never steals focus moved outside', () => {
  const target = React.createRef<HTMLButtonElement>();
  const draw = (open: boolean) =>
    act(() =>
      root.render(
        <>
          <button ref={target}>Return</button>
          <button id="outside">Outside</button>
          <Collapsible open={open} returnFocusRef={target}>
            <input />
          </Collapsible>
        </>,
      ),
    );
  draw(true);
  const input = container.querySelector('input')!;
  act(() => input.focus());
  draw(false);
  expect(document.activeElement).toBe(target.current);
  draw(true);
  const outside = container.querySelector<HTMLElement>('#outside')!;
  act(() => outside.focus());
  draw(false);
  expect(document.activeElement).toBe(outside);
});
it('uses the actual opening focus when no explicit return target is supplied', () => {
  const draw = (open: boolean) =>
    act(() =>
      root.render(
        <>
          <button>Open</button>
          <Collapsible open={open}>
            <input />
          </Collapsible>
        </>,
      ),
    );
  draw(false);
  const button = container.querySelector('button')!;
  act(() => button.focus());
  draw(true);
  act(() => container.querySelector('input')!.focus());
  draw(false);
  expect(document.activeElement).toBe(button);
});
