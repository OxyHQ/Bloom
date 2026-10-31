/** @jest-environment jsdom */
import { act, createRef, useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { AppShellPanels } from '../app-shell/index.web';
import type { AppShellPanelViewport } from '../app-shell';
import { panelLayoutCss } from '../app-shell/panel-layout-css';
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

it('enables entry motion only after the initial tracks have computed final styles', () => {
  const reads: boolean[] = [];
  const layoutReads: boolean[] = [];
  const rect = HTMLElement.prototype.getBoundingClientRect;
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.hasAttribute('data-bloom-panel-group'))
      layoutReads.push(this.hasAttribute('data-bloom-panel-ready'));
    return rect.call(this);
  });
  const beforePaint: boolean[] = [];
  function ObserveCommit() {
    useLayoutEffect(() => {
      beforePaint.push(
        host.querySelector('[data-bloom-panel-group]')?.hasAttribute('data-bloom-panel-ready') ??
          false,
      );
    });
    return null;
  }
  const computedStyle = jest.mocked(window.getComputedStyle).getMockImplementation();
  if (!computedStyle) throw new Error('Missing computed-style adapter');
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    if (element.hasAttribute('data-bloom-panel-index')) {
      const group = element.closest('[data-bloom-panel-group]');
      reads.push(group?.hasAttribute('data-bloom-panel-ready') ?? false);
    }
    return computedStyle(element, pseudo);
  });
  const renderPanels = (extra: boolean) => (
    <BloomThemeProvider>
      <AppShellPanels
        testID="entry-panels"
        layout={{
          transition: 'exit-before-enter',
          panels: [{ id: 'main', width: 620 }, ...(extra ? [{ id: 'added', width: 390 }] : [])],
        }}
      />
      <ObserveCommit />
    </BloomThemeProvider>
  );
  act(() => root.render(renderPanels(false)));
  const group = host.querySelector('[data-bloom-panel-group]');
  const main = host.querySelector('[data-testid="entry-panels-main"]');
  expect(reads[0]).toBe(false);
  expect(layoutReads).toEqual([false]);
  expect(beforePaint[0]).toBe(true);
  expect(group?.getAttribute('data-bloom-panel-ready')).toBe('true');
  reads.length = 0;
  act(() => root.render(renderPanels(true)));
  expect(host.querySelector('[data-testid="entry-panels-main"]')).toBe(main);
  expect(reads.length).toBeGreaterThan(0);
  expect(reads.every(Boolean)).toBe(true);
  const scope = group?.getAttribute('data-bloom-panel-group');
  if (!scope) throw new Error('Missing CSS panel group');
  const css = panelLayoutCss(scope, { panels: [{ id: 'main' }, { id: 'added' }] }, 8);
  expect(css).toContain(`[data-bloom-panel-group="${scope}"]:not([data-bloom-panel-ready])`);
  expect(css).toContain('[data-bloom-shell-nav="' + scope + '"]){transition:none!important}');
  const entries = [...css.matchAll(/@starting-style\{([^{}]+)\{/g)];
  expect(entries).toHaveLength(2);
  for (const [, selector] of entries) {
    expect(selector).toContain('[data-bloom-panel-ready]');
    expect(selector).toContain(':not([data-bloom-panel-ordering])');
  }
  const added = host.querySelector('[data-testid="entry-panels-added"]');
  expect(added?.matches(entries[1]?.[1] ?? '')).toBe(true);
  group?.removeAttribute('data-bloom-panel-ready');
  expect(added?.matches(entries[1]?.[1] ?? '')).toBe(false);
});

it('lets an explicitly unrestricted split envelope fill available shell space', () => {
  const layout = {
    mode: 'split' as const,
    panels: [{ id: 'list', width: 380, minWidth: 320, maxWidth: 480 }, { id: 'detail' }],
  };
  const capped = panelLayoutCss('bounded', layout, 12);
  const fluid = panelLayoutCss('fluid', layout, 12, {}, {}, true);
  expect(capped).toContain('width:min(var(--bloom-reading-envelope), max(0px, calc(100cqw');
  expect(fluid).toContain('width:max(0px, calc(100cqw');
  expect(fluid).not.toContain('width:min(var(--bloom-reading-envelope)');
  expect(fluid).toContain('flex:var(--fluid-panel-grow-1, 1) 1');
});

it('releases the fixed shell clip only for a horizontal document deck', () => {
  const panels = [
    { id: 'a', width: 360 },
    { id: 'b', width: 360 },
  ];
  const selector = '[data-bloom-shell-host="deck"]{overflow:visible!important}';
  const documentDeck = panelLayoutCss('deck', { mode: 'deck', panels }, 8);
  expect(documentDeck).toContain(selector);
  expect(
    panelLayoutCss('deck', { mode: 'deck', horizontalScroll: 'contained', panels }, 8),
  ).not.toContain(selector);
  expect(panelLayoutCss('deck', { mode: 'deck', axis: 'vertical', panels }, 8)).not.toContain(
    selector,
  );
  const responsive = panelLayoutCss(
    'deck',
    { mode: 'deck', axis: { base: 'vertical', lg: 'horizontal' }, panels },
    8,
  );
  expect(responsive).toContain(selector);
  expect(responsive.indexOf(selector)).toBeGreaterThan(
    responsive.indexOf('@container deck (min-width:1024px)'),
  );
});
