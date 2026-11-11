/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { View } from 'react-native';
import { useBorderBoxSize } from '../hooks/use-border-box-size';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, useScreen } from '../screen';
import { PageHeader } from '../page-header';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { fakeWindow } from './support/fake-window';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const originalObserver = globalThis.ResizeObserver;
let observers: Observer[];
class Observer {
  callback: ResizeObserverCallback;
  target?: Element;
  observe = jest.fn((target: Element) => {
    if (!this.target) observers.push(this);
    this.target = target;
  });
  disconnect = jest.fn();
  unobserve = jest.fn();
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  emit(width: number, height: number, legacy = false) {
    this.callback(
      [
        {
          target: this.target,
          borderBoxSize: legacy ? undefined : [{ inlineSize: width, blockSize: height }],
          contentRect: { width: width - 20, height: height - 20 },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
}
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  observers = [];
  globalThis.ResizeObserver = Observer as unknown as typeof ResizeObserver;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.ResizeObserver = originalObserver;
  jest.restoreAllMocks();
});
function Probe({
  onSize,
  shown = true,
}: {
  onSize: (size: { width: number; height: number }) => void;
  shown?: boolean;
}) {
  const size = useBorderBoxSize(onSize);
  return shown ? <View testID="box" {...size} /> : null;
}
it('reports border-box dimensions without synchronous geometry reads, including wrapping and hide/reveal', () => {
  const onSize = jest.fn();
  act(() => root.render(<Probe onSize={onSize} />));
  const observer = observers[0]!;
  const node = container.firstElementChild as HTMLElement;
  const bounds = jest.spyOn(node, 'getBoundingClientRect');
  const width = jest.spyOn(node, 'offsetWidth', 'get');
  const height = jest.spyOn(node, 'offsetHeight', 'get');
  expect(observer.observe).toHaveBeenCalledWith(node, { box: 'border-box' });
  for (const [w, h] of [
    [620, 56],
    [390, 80],
    [0, 0],
    [390, 104],
  ])
    act(() => observer.emit(w!, h!));
  expect(onSize.mock.calls.map(([size]) => size)).toEqual([
    { width: 620, height: 56 },
    { width: 390, height: 80 },
    { width: 0, height: 0 },
    { width: 390, height: 104 },
  ]);
  expect(bounds).not.toHaveBeenCalled();
  expect(width).not.toHaveBeenCalled();
  expect(height).not.toHaveBeenCalled();
});
it('keeps the observer through callback changes and rejects queued callbacks after detach', () => {
  const first = jest.fn(),
    second = jest.fn();
  act(() => root.render(<Probe onSize={first} />));
  const observer = observers[0]!;
  act(() => root.render(<Probe onSize={second} />));
  act(() => observer.emit(390, 56));
  expect(observers).toHaveLength(1);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  act(() => root.render(<Probe onSize={second} shown={false} />));
  expect(observer.disconnect).toHaveBeenCalledTimes(1);
  act(() => observer.emit(0, 0));
  expect(second).toHaveBeenCalledTimes(1);
  act(() => root.render(<Probe onSize={second} />));
  expect(observers).toHaveLength(2);
  act(() => observers[1]!.emit(620, 56));
  expect(second).toHaveBeenLastCalledWith({ width: 620, height: 56 });
});
it('uses a legacy observer target border box when borderBoxSize is unavailable', () => {
  const onSize = jest.fn();
  act(() => root.render(<Probe onSize={onSize} />));
  const node = container.firstElementChild!;
  Object.defineProperties(node, { offsetWidth: { value: 420 }, offsetHeight: { value: 96 } });
  act(() => observers[0]!.emit(400, 76, true));
  expect(onSize).toHaveBeenLastCalledWith({ width: 420, height: 96 });
});
it('does not observe during SSR and retains onLayout when ResizeObserver is unavailable', () => {
  const onSize = jest.fn();
  renderToString(<Probe onSize={onSize} />);
  expect(observers).toHaveLength(0);
  Reflect.deleteProperty(globalThis, 'ResizeObserver');
  act(() => root.render(<Probe onSize={onSize} />));
  const node = container.firstElementChild as HTMLElement & {
    __reactLayoutHandler: (event: unknown) => void;
  };
  act(() =>
    node.__reactLayoutHandler({ nativeEvent: { layout: { width: 320, height: 64, x: 2, y: 4 } } }),
  );
  expect(onSize).toHaveBeenCalledWith({ width: 320, height: 64, x: 2, y: 4 });
});

it.each([false, true])(
  'updates Screen chrome reserves and dynamic footer (window: %s)',
  (windowed) => {
    let inset = { top: 0, bottom: 0 };
    function Content() {
      const screen = useScreen();
      inset = { top: screen.topInset, bottom: screen.bottomInset };
      return null;
    }
    const { adapter } = fakeWindow({});
    const screen = (
      <Screen testID="screen" scroll="none" header={<View />} bottomBar={<View />}>
        <Content />
      </Screen>
    );
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          {windowed ? (
            <PlatformSurfaceProvider value={adapter}>{screen}</PlatformSurfaceProvider>
          ) : (
            screen
          )}
        </BloomThemeProvider>,
      ),
    );
    const header = observers.find(
      (item) => item.target?.getAttribute('data-testid') === 'screen-header',
    )!;
    const footer = observers.find(
      (item) => item.target?.getAttribute('data-testid') === 'screen-bottom',
    )!;
    act(() => {
      header.emit(620, 56);
      footer.emit(620, 72);
    });
    const extraBottom = inset.bottom - 72;
    expect(inset.top).toBe(56);
    act(() => {
      header.emit(390, 104);
      footer.emit(390, 120);
    });
    expect(inset).toEqual({ top: 104, bottom: 120 + extraBottom });
    act(() => footer.emit(390, 0));
    expect(inset.bottom).toBe(extraBottom);
  },
);

it('keeps PageHeader action breakpoints while consuming observer sizes', () => {
  const actions = jest.fn(() => null);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <PageHeader testID="header" title="Title" actions={actions} />
      </BloomThemeProvider>,
    ),
  );
  const observer = observers.find((item) => item.target?.getAttribute('data-testid') === 'header')!;
  act(() => observer.emit(639, 56));
  actions.mockClear();
  act(() => observer.emit(638, 56));
  act(() => observer.emit(400, 56));
  expect(actions).not.toHaveBeenCalled();
  act(() => observer.emit(640, 56));
  expect(actions).toHaveBeenCalledTimes(1);
  expect(actions).toHaveBeenLastCalledWith({ compact: false, spacious: false });
});
