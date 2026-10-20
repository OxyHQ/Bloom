/** @jest-environment jsdom */
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { AppShellPanels } from '../app-shell/index.web';
import type { AppShellPanelViewport } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.defineProperty(globalThis, 'CSS', {
    value: { supports: () => true },
    configurable: true,
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const original = window.getComputedStyle.bind(window);
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = original(element, pseudo);
    return new Proxy(style, {
      get(target, key) {
        if (key === 'getPropertyValue')
          return (name: string) =>
            name === '--bloom-panel-visible'
              ? '1'
              : name === '--bloom-panel-axis'
                ? 'horizontal'
                : target.getPropertyValue(name);
        return Reflect.get(target, key, target);
      },
    });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.restoreAllMocks();
});
it.each(['contained', 'document'] as const)(
  'exposes the existing %s owner for offset, measure, scrollBy, reveal and scroll observation',
  async (horizontalScroll) => {
    const viewport = createRef<AppShellPanelViewport>();
    const observed = jest.fn();
    act(() =>
      root.render(
        <BloomThemeProvider>
          <AppShellPanels
            testID="panels"
            layout={{
              mode: 'deck',
              horizontalScroll,
              viewportRef: viewport,
              onViewportScroll: observed,
              panels: [
                { id: 'a', width: 200 },
                { id: 'b', width: 200 },
              ],
            }}
          />
        </BloomThemeProvider>,
      ),
    );
    const wrapper = host.querySelector<HTMLElement>('[data-testid="panels-scroll"]');
    const scroller = wrapper?.firstElementChild as HTMLElement | null;
    const panel = host.querySelector<HTMLElement>('[data-testid="panels-b"]');
    if (!scroller || !panel || !viewport.current)
      throw new Error('Missing public compositor viewport');
    const bounds = (x: number, width: number) => ({
      x,
      y: 0,
      left: x,
      right: x + width,
      top: 0,
      bottom: 600,
      width,
      height: 600,
      toJSON: () => ({}),
    });
    scroller.getBoundingClientRect = () => bounds(10, 400);
    panel.getBoundingClientRect = () => bounds(650, 200);
    scroller.scrollLeft = 75;
    Object.defineProperty(window, 'scrollX', { value: 75, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    const scroll = jest.fn((input?: ScrollToOptions | number, y?: number) => {
      const options = typeof input === 'number' ? { left: input, top: y } : (input ?? {});
      if (horizontalScroll === 'document') {
        window.scrollX += options.left ?? 0;
        window.scrollY += options.top ?? 0;
        window.dispatchEvent(new Event('scroll'));
      } else {
        scroller.scrollLeft += options.left ?? 0;
        scroller.scrollTop += options.top ?? 0;
        scroller.dispatchEvent(new Event('scroll'));
      }
    });
    if (horizontalScroll === 'document') window.scrollBy = scroll;
    else scroller.scrollBy = scroll;
    expect(viewport.current.getOffset()).toEqual({ x: 75, y: 0 });
    expect(await viewport.current.measure()).toEqual({
      x: horizontalScroll === 'document' ? 0 : 10,
      y: 0,
      width: 400,
      height: 600,
    });
    act(() => viewport.current?.scrollBy({ x: 30 }));
    expect(scroll).toHaveBeenLastCalledWith({ left: 30, top: 0, behavior: 'instant' });
    expect(observed).toHaveBeenLastCalledWith({ x: 105, y: 0 });
    expect(viewport.current.getOffset()).toEqual({ x: 105, y: 0 });
    await act(async () => {
      viewport.current?.reveal('b');
      await Promise.resolve();
    });
    expect(scroll).toHaveBeenLastCalledWith({
      left: horizontalScroll === 'document' ? 450 : 440,
      top: 0,
      behavior: 'instant',
    });
    scroll.mockClear();
    viewport.current.reveal('missing');
    expect(scroll).not.toHaveBeenCalled();
  },
);
