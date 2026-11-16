import { readFileSync } from 'node:fs';
import path from 'node:path';
import { transformSync } from '@babel/core';
import { bubbleGeometry } from '../swipe-row/bubble-geometry';

/** The Babel-generated native closures and Reanimated's real mapper registry.
 * UI scheduling is synchronous here; this tests subscriptions, not Fabric paint. */
type Worklet = (() => Record<string, unknown>) & { __closure?: unknown[] };
type Mutable = ReturnType<typeof mutable>;
function mutable(initial: unknown) {
  let value = initial;
  const listeners = new Map<number, (value: unknown) => void>();
  return {
    _isReanimatedSharedValue: true,
    get value() {
      return value;
    },
    set value(next: unknown) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of listeners.values()) listener(value);
    },
    addListener: (id: number, listener: (value: unknown) => void) => listeners.set(id, listener),
    removeListener: (id: number) => listeners.delete(id),
  };
}

function compile(source: string, filename: string, worklets = false): string {
  const code = transformSync(source, {
    filename,
    configFile: false,
    babelrc: false,
    presets: ['module:@react-native/babel-preset'],
    plugins: worklets ? ['react-native-worklets/plugin'] : [],
  })?.code;
  if (!code) throw new Error('Native source did not compile');
  return code;
}

function evaluate(code: string, resolve: (id: string) => unknown, runtime: object = { Error }) {
  const module = { exports: {} as Record<string, unknown> };
  new Function('require', 'module', 'exports', 'global', 'requestAnimationFrame', code)(
    resolve,
    module,
    module.exports,
    runtime,
    () => {},
  );
  return module.exports;
}

function fixture(indirectClosure = false) {
  // Jest maps every Reanimated import (including package.json) to its mock.
  const reanimated = path.resolve('node_modules/react-native-reanimated');
  const nativeModule = (relative: string, resolve: (id: string) => unknown) => {
    const filename = path.join(reanimated, 'src', relative);
    return evaluate(compile(readFileSync(filename, 'utf8'), filename), resolve);
  };
  const shared = nativeModule('isSharedValue.ts', () => {
    throw new Error('Unexpected import');
  });
  const mapper = nativeModule('mappers.ts', (id) => {
    if (id === 'react-native-worklets') return { scheduleOnUI: (fn: () => void) => fn() };
    if (id === './common') return { IS_JEST: true };
    if (id === './isSharedValue') return shared;
    throw new Error(`Unexpected mapper import: ${id}`);
  }) as { startMapper: (fn: () => void, inputs: unknown[], outputs?: Mutable[]) => number };
  const styles: Record<string, unknown>[] = [];
  const hooks = {
    __esModule: true,
    default: { View: 'View' },
    // Only the negative control uses this: function closures hide subscriptions.
    useCallback: (fn: Worklet) => fn,
    useDerivedValue: (fn: Worklet) => {
      const derived = mutable(fn());
      mapper.startMapper(
        () => {
          derived.value = fn();
        },
        fn.__closure ?? [],
        [derived],
      );
      return derived;
    },
    useAnimatedStyle: (fn: Worklet) => {
      const style = {};
      mapper.startMapper(() => Object.assign(style, fn()), fn.__closure ?? []);
      styles.push(style);
      return style;
    },
  };
  const filename = path.resolve('src/swipe-row/SwipeRowBubble.tsx');
  let source = readFileSync(filename, 'utf8');
  if (indirectClosure) {
    source = source
      .replace(/useDerivedValue/g, 'useCallback')
      .replace(/geometry\.value/g, 'geometry()')
      .replace(/\[geometry, index\]/g, '[geometry, index, translateX, rowWidth]')
      .replace(/\[geometry\]/g, '[geometry, translateX, rowWidth]');
  }
  const component = evaluate(compile(source, filename, true), (id) => {
    if (id === 'react-native-reanimated') return hooks;
    if (id === 'react-native') return { Pressable: 'Pressable' };
    if (id === '../typography') return { Text: 'Text' };
    if (id === './bubble-geometry') return { bubbleGeometry };
    if (id.startsWith('react')) return require(id);
    throw new Error(`Unexpected bubble import: ${id}`);
  }) as { SwipeRowBubble: (props: Record<string, unknown>) => unknown };
  const translateX = mutable(0);
  const rowWidth = mutable(390);
  component.SwipeRowBubble({
    action: { key: 'archive', label: 'Archive', icon: 'Icon' },
    side: 'right',
    index: 0,
    count: 1,
    primary: 0,
    actionWidth: 56,
    translateX,
    rowWidth,
    background: 'red',
    foreground: 'white',
    open: false,
    onPress: () => {},
  });
  const [shape, label] = styles;
  if (!shape || !label) throw new Error('Expected both native animated styles');
  return { translateX, rowWidth, shape, label };
}

it('updates native bubble and label geometry from drag and layout without a React render', () => {
  const { translateX, rowWidth, shape, label } = fixture();
  expect(shape.width).toBe(0);
  translateX.value = -56;
  expect(shape.width).toBe(48);
  translateX.value = -200;
  expect(shape.width).toBeGreaterThan(190);
  expect(label.width).toBe(96);
  expect(label.opacity).toBe(1);
  const expandedWidth = shape.width;
  rowWidth.value = 500;
  expect(shape.width).not.toBe(expandedWidth);
  translateX.value = 0;
  expect(shape.width).toBe(0);
  expect(label.width).toBe(0);
  expect(label.opacity).toBe(0);
});

it('detects the old captured-function failure even when a JS dependency array names the shared values', () => {
  const { translateX, shape, label } = fixture(true);
  translateX.value = -200;
  expect(shape.width).toBe(0);
  expect(label.width).toBe(0);
});
