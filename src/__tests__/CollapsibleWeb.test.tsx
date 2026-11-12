/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
let mockReduced = true;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
import { Collapsible } from '../collapsible/Collapsible.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement, root: Root;
let observations = 0;
let naturalHeight = 900;
beforeEach(() => {
  observations = 0;
  mockReduced = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.ResizeObserver = class {
    constructor() {
      observations += 1;
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
  // Open and at rest: no cap and no clip, so content that grows or overflows is never cut.
  expect(panel.style.maxHeight).toBe('');
  expect(panel.style.overflow).toBe('visible');
  expect(container.querySelector('.custom-body')?.getAttribute('style')).toContain('padding: 18px');
  naturalHeight = 1300;
  draw(true);
  expect(observations).toBe(0);
  expect(panel.style.maxHeight).toBe('');
  draw(false);
  expect(panel.dataset.open).toBe('false');
  expect(panel.classList.contains('bloom-collapsible-css')).toBe(true);
  expect(panel.style.maxHeight).toBe('');
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
it('unmounts its children once shut when keepMounted is false, and mounts them again on opening', () => {
  const draw = (open: boolean) =>
    act(() =>
      root.render(
        <Collapsible open={open} keepMounted={false} testID="body">
          <input defaultValue="Fresh" />
        </Collapsible>,
      ),
    );
  draw(false);
  expect(container.querySelector('input')).toBeNull();
  draw(true);
  const input = container.querySelector<HTMLInputElement>('input')!;
  expect(input).not.toBeNull();
  draw(false);
  expect(container.querySelector('input')).toBeNull();
  expect(container.querySelector('[data-testid=body]')).not.toBeNull();
});

it('waits for its own CSS geometry completion, cancels closure on reopen and never starts Animated sizing', () => {
  mockReduced = false;
  const draw = (open: boolean) =>
    act(() =>
      root.render(
        <Collapsible open={open} keepMounted={false} testID="lifecycle">
          <input defaultValue="Saved" />
        </Collapsible>,
      ),
    );
  const end = (node: Element, propertyName: string) =>
    act(() => {
      const event = new Event('transitionend', { bubbles: true });
      Object.defineProperty(event, 'propertyName', { value: propertyName });
      node.dispatchEvent(event);
    });
  draw(true);
  const panel = container.querySelector<HTMLElement>('[data-testid=lifecycle]')!;
  const input = container.querySelector('input')!;
  draw(false);
  expect(container.querySelector('input')).toBe(input);
  end(input, 'grid-template-rows');
  end(panel, 'opacity');
  expect(container.querySelector('input')).toBe(input);
  draw(true);
  end(panel, 'grid-template-rows');
  expect(container.querySelector('input')).toBe(input);
  expect(panel.dataset.settled).toBe('true');
  draw(false);
  end(panel, 'grid-template-rows');
  expect(container.querySelector('input')).toBeNull();
  expect(observations).toBe(0);
  expect(HTMLElement.prototype.getBoundingClientRect).not.toHaveBeenCalled();
});

it('is as wide as its container, never as its widest line', () => {
  // A grid's implicit column is `auto` and its item's min-width is `auto`, so a line that cannot
  // wrap (a one-line sidebar title) widened the panel past its container: the sidebar's rows ran
  // out under its edge, their time and menu with them. jsdom lays nothing out, so this pins the
  // two declarations that hold the column to the container.
  act(() =>
    root.render(
      <Collapsible open testID="body">
        <input defaultValue="x" />
      </Collapsible>,
    ),
  );
  const css = document.getElementById('bloom-collapsible')?.textContent ?? '';
  expect(css).toMatch(/\.bloom-collapsible-css \{[^}]*grid-template-columns:minmax\(0,1fr\)/);
  expect(css).toMatch(/\.bloom-collapsible-clip \{[^}]*min-width:0/);
});
