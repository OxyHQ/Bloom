/** @jest-environment jsdom */
import React, { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { AppShellPanels, useAppShellPanel } from '../app-shell/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
let secondaryVisible: boolean;
let resizeCallbacks: ResizeObserverCallback[];
const originalResizeObserver = globalThis.ResizeObserver;
const originalCss = globalThis.CSS;

beforeEach(() => {
  secondaryVisible = false;
  resizeCallbacks = [];
  Object.defineProperty(globalThis, 'CSS', { value: { supports: () => true }, configurable: true });
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      resizeCallbacks.push(callback);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const original = window.getComputedStyle.bind(window);
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = original(element, pseudo);
    return new Proxy(style, {
      get(target, key) {
        if (key === 'getPropertyValue')
          return (name: string) => {
            if (name === '--bloom-panel-axis') return 'horizontal';
            if (name === '--bloom-panel-visible')
              return element.getAttribute('data-bloom-panel-index') === '1' && !secondaryVisible
                ? '0'
                : '1';
            return target.getPropertyValue(name);
          };
        return Reflect.get(target, key, target);
      },
    });
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
  Object.defineProperty(globalThis, 'CSS', { value: originalCss, configurable: true });
});

it('lets effects wait for CSS visibility and then follows resize without losing the panel', () => {
  const starts = jest.fn();
  const stops = jest.fn();
  const observations: Array<{
    id: string;
    ready: boolean | undefined;
    active: boolean | undefined;
  }> = [];
  function Probe({ id }: { id: string }) {
    const { visibilityReady, active } = useAppShellPanel();
    observations.push({ id, ready: visibilityReady, active });
    useEffect(() => {
      if (visibilityReady === false || active === false) return;
      starts(id);
      return () => stops(id);
    }, [id, visibilityReady, active]);
    return <span data-testid={`probe-${id}`}>{id}</span>;
  }
  const renderPanels = (hideBelow = 990) => (
    <BloomThemeProvider>
      <AppShellPanels
        layout={{
          panels: [
            { id: 'main', content: <Probe id="main" /> },
            { id: 'context', hideBelow, content: <Probe id="context" /> },
          ],
        }}
      />
    </BloomThemeProvider>
  );
  act(() => root.render(renderPanels()));
  expect(observations.find((item) => item.id === 'context')?.ready).toBe(false);
  expect(starts.mock.calls).toEqual([['main']]);
  const side = host.querySelector('[data-testid="probe-context"]');
  expect(side).not.toBeNull();

  secondaryVisible = true;
  act(() => {
    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
  });
  expect(starts.mock.calls).toEqual([['main'], ['context']]);
  expect(host.querySelector('[data-testid="probe-context"]')).toBe(side);

  // Callers often rebuild descriptors during unrelated renders. Their identity
  // is not a geometry change and must not stop a visible panel's work.
  observations.length = 0;
  act(() => root.render(renderPanels()));
  expect(observations.every((item) => item.ready === true)).toBe(true);
  expect(stops).not.toHaveBeenCalled();
  expect(starts.mock.calls).toEqual([['main'], ['context']]);

  // A changed rule updates the side without interrupting unrelated work.
  observations.length = 0;
  secondaryVisible = false;
  act(() => root.render(renderPanels(1500)));
  expect(observations.every((item) => item.ready === true)).toBe(true);
  expect(stops.mock.calls).toEqual([['context']]);
  expect(host.querySelector('[data-testid="probe-context"]')).toBe(side);

  secondaryVisible = true;
  act(() => {
    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
  });
  expect(starts.mock.calls).toEqual([['main'], ['context'], ['context']]);
  expect(host.querySelector('[data-testid="probe-context"]')).toBe(side);
});

it('reports ready outside a panel', () => {
  let result: boolean | undefined;
  function Probe() {
    result = useAppShellPanel().visibilityReady;
    return null;
  }
  act(() => root.render(<Probe />));
  expect(result).toBe(true);
});

it('does not mount a newly inserted hidden panel before CSS resolves it', () => {
  const started = jest.fn();
  function Secondary() {
    const { visibilityReady, active } = useAppShellPanel();
    useEffect(() => {
      if (visibilityReady !== false && active !== false) started();
    }, [visibilityReady, active]);
    return <span>Secondary</span>;
  }
  const ui = (add: boolean) => (
    <BloomThemeProvider>
      <AppShellPanels
        layout={{
          panels: [
            { id: 'main', content: <span>Main</span> },
            ...(add ? [{ id: 'context', hideBelow: 990, content: <Secondary /> }] : []),
          ],
        }}
      />
    </BloomThemeProvider>
  );
  act(() => root.render(ui(false)));
  act(() => root.render(ui(true)));
  expect(started).not.toHaveBeenCalled();
  expect(host.textContent).not.toContain('Secondary');
  secondaryVisible = true;
  act(() => {
    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
  });
  expect(started).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain('Secondary');
});
