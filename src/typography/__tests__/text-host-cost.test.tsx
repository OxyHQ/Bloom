/**
 * What one `Text` costs on native, where a feed row draws dozens of them.
 *
 * Without a className there is nothing for `react-native-css` to resolve, so the
 * text is the react-native node itself: one component, no hook slot, and two
 * context reads (the theme and the typography scope). Native resolves
 * `use-paint-colors.native.ts`, emulated here, so the web-only prepaint context
 * is not read. With a className the interop host is still there to resolve it.
 */
import TestRenderer, { act } from 'react-test-renderer';
import { Text as RNText } from 'react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Text } from '..';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual(
    '../../../node_modules/react-native-css/dist/commonjs/native-internal/index.js',
  ),
);
jest.mock('../../theme/prepaint/use-paint-colors', () =>
  jest.requireActual('../../theme/prepaint/use-paint-colors.native'),
);

type Fiber = {
  tag: number;
  type: unknown;
  child: Fiber | null;
  sibling: Fiber | null;
  memoizedState: { next: unknown } | null;
  dependencies?: { firstContext: { next: unknown } | null } | null;
};

/** Bloom's function components for one `Text`, with their hook slots and context reads. */
function textCost(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {element}
      </BloomThemeProvider>,
    );
  });
  const host = renderer.root.findByProps({ testID: 'probe' });
  const fiber = (host as unknown as { _fiber: Fiber })._fiber;
  const name = (f: Fiber) =>
    (f.type as { displayName?: string }).displayName ?? (f.type as { name?: string }).name;
  const rows: { name?: string; hooks: number; contexts: number }[] = [];
  const walk = (f: Fiber | null, siblings: boolean): void => {
    for (let node = f; node; node = siblings ? node.sibling : null) {
      // react-native's own Text is the same node on both paths: count Bloom's layers.
      if ([0, 11, 14, 15].includes(node.tag) && node.type !== RNText) {
        let hooks = 0;
        let contexts = 0;
        for (let h = node.memoizedState; h; h = h.next as typeof h) hooks += 1;
        for (let d = node.dependencies?.firstContext; d; d = d.next as typeof d) contexts += 1;
        rows.push({ name: name(node), hooks, contexts });
      }
      walk(node.child, true);
    }
  };
  walk(fiber, false);
  act(() => renderer.unmount());
  return rows;
}

it('draws a text without a className as the react-native node, reading theme and scope only', () => {
  expect(textCost(<Text testID="probe">Hello</Text>)).toEqual([
    { name: 'Text', hooks: 0, contexts: 2 },
  ]);
});

it('keeps the interop host for a className', () => {
  expect(
    textCost(
      <Text testID="probe" className="font-bold">
        Hello
      </Text>,
    ).map((row) => row.name),
  ).toEqual(['Text', 'CssInterop.DisplayFaceText', 'DisplayFaceText']);
});
