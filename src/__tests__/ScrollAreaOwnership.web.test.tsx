/** @jest-environment jsdom */
import { act, createRef, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ScrollArea } from '../layout/ScrollArea.web';
import { ScrollBar } from '../layout/ScrollBar.web';
import { Screen } from '../screen/Screen.web';
import { ScreenHostContext } from '../screen/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('uses one native owner and forwards its ref while sizing the area, with custom indicators by default', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<any>();
  act(() =>
    root.render(
      <ScrollArea ref={ref} testID="area" style={{ height: 300 }} className="grow">
        <div>Content</div>
      </ScrollArea>,
    ),
  );
  const owner = ref.current.getScrollableNode();
  expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  expect(host.querySelector('[data-testid="area"]')?.contains(owner)).toBe(true);
  expect(host.querySelector('[data-testid="area"]')).not.toBe(owner);
  act(() => root.unmount());
  host.remove();
});

it('attaches to DOM and virtualized-list owners without creating another scroll container', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const owner = document.createElement('div');
  host.append(owner);
  const root = createRoot(host.appendChild(document.createElement('div')));
  const target = { current: { getNativeScrollRef: () => owner } };
  act(() => root.render(<ScrollBar target={target} />));
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  act(() => root.render(<ScrollBar target={{ current: owner }} />));
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  act(() => root.unmount());
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(false);
  host.remove();
});

it('suppresses the browser indicator before paint and follows a replacement target in that commit', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const first = document.createElement('div');
  const second = document.createElement('div');
  const target = { current: first };
  const painted: boolean[] = [];
  function PaintProbe() {
    useLayoutEffect(() => {
      painted.push(target.current.hasAttribute('data-bloom-scroll-area'));
    });
    return null;
  }
  const root = createRoot(host);
  const show = () =>
    act(() =>
      root.render(
        <>
          <ScrollBar target={target} />
          <PaintProbe />
        </>,
      ),
    );
  try {
    show();
    expect(painted[0]).toBe(true);
    target.current = second;
    show();
    expect(painted.every(Boolean)).toBe(true);
    expect(first.hasAttribute('data-bloom-scroll-area')).toBe(false);
    expect(second.hasAttribute('data-bloom-scroll-area')).toBe(true);
  } finally {
    act(() => root.unmount());
    expect(second.hasAttribute('data-bloom-scroll-area')).toBe(false);
    host.remove();
  }
});

it('shares suppression across axes and preserves a pre-existing marker after the last owner leaves', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const target = { current: document.createElement('div') };
  target.current.setAttribute('data-bloom-scroll-area', 'server-owned');
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <>
          <ScrollBar target={target} />
          <ScrollBar target={target} horizontal />
        </>,
      ),
    );
    act(() => root.render(<ScrollBar target={target} />));
    expect(target.current.hasAttribute('data-bloom-scroll-area')).toBe(true);
    act(() => root.render(null));
    expect(target.current.getAttribute('data-bloom-scroll-area')).toBe('server-owned');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('retains document suppression without an overlay when the shell is bounded', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const owner = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  const initialOverflow = owner.style.overflow;
  try {
    act(() => root.render(<ScrollBar target="document" scrollbar="never" />));
    expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
    expect(host.querySelector('[data-bloom-scrollbar]')).toBeNull();
    expect(owner.style.overflow).toBe(initialOverflow);
    act(() => root.render(<ScrollBar target="document" scrollbar="scroll" />));
    expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
    expect(host.querySelector('[data-bloom-scrollbar]')).not.toBeNull();
  } finally {
    act(() => root.unmount());
    expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(false);
    host.remove();
  }
});

it('resolves an ancestor ref at the commit microtask before the next paint', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const target = createRef<HTMLDivElement>();
  try {
    await act(async () =>
      root.render(
        <div ref={target}>
          <ScrollBar target={target} />
        </div>,
      ),
    );
    expect(target.current?.hasAttribute('data-bloom-scroll-area')).toBe(true);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('cancels a late ref claim when its scrollbar leaves before the commit microtask', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const target = createRef<HTMLDivElement>();
  act(() =>
    root.render(
      <div ref={target}>
        <ScrollBar target={target} />
      </div>,
    ),
  );
  const owner = target.current;
  act(() => root.unmount());
  await act(async () => {
    await Promise.resolve();
  });
  expect(owner?.hasAttribute('data-bloom-scroll-area')).toBe(false);
  host.remove();
});

it('keeps a retained Screen viewport suppressed while its inactive content exits', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const show = (active: boolean) =>
    act(async () =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <ScreenHostContext.Provider value={{ active: true, kind: 'element' }}>
            <Screen active={active}>
              <div>Outgoing content</div>
            </Screen>
          </ScreenHostContext.Provider>
        </BloomThemeProvider>,
      ),
    );
  try {
    await show(true);
    const owner = host.querySelector('[data-bloom-screen-viewport="element"]');
    expect(owner?.hasAttribute('data-bloom-scroll-area')).toBe(true);
    await show(false);
    expect(host.querySelector('[data-bloom-screen-viewport="element"]')).toBe(owner);
    expect(owner?.hasAttribute('data-bloom-scroll-area')).toBe(true);
    expect(host.querySelector('[data-bloom-scrollbar]')).toBeNull();
    await show(true);
    expect(owner?.hasAttribute('data-bloom-scroll-area')).toBe(true);
    expect(host.querySelector('[data-bloom-scrollbar]')).not.toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
