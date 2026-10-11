import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { Button } from '../button/Button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, hostNodes, type HostNode } from './support/rendered-style';
import { createYogaHostRenderer } from './support/yoga-host-tree';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
);

let yoga: ReturnType<typeof createYogaHostRenderer>;
beforeAll(() => {
  yoga = createYogaHostRenderer();
}, 120_000);
afterAll(() => yoga?.dispose());
const pill: ViewStyle = {
  height: 'auto',
  minHeight: 40,
  maxWidth: 344,
  minWidth: 0,
  flexShrink: 1,
  paddingHorizontal: 16,
  paddingVertical: 0,
  borderWidth: 1.5,
};
function wrapped(loading = false) {
  const api = render(
    <BloomThemeProvider>
      <View testID="root" style={{ width: 344 }}>
        <View testID="grid" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 12 }, (_, index) => (
            <Button
              key={index}
              testID={`pill${index}`}
              material="flat"
              loading={loading}
              style={pill}
            >
              <Text style={{ flexShrink: 1 }}>Label</Text>
            </Button>
          ))}
        </View>
      </View>
    </BloomThemeProvider>,
  );
  return { api, tree: findHost(api.toJSON(), 'root')! };
}

it.each([false, true])(
  'measures intrinsic wrapped native buttons with actual Yoga, RTL=%s',
  (rtl) => {
    const { tree } = wrapped();
    const boxes = yoga.layout(tree, rtl);
    expect(boxes.get('grid')).toMatchObject({ width: 344, height: 136 });
    for (let i = 0; i < 12; i++)
      expect(boxes.get(`pill${i}`)).toEqual({
        x: rtl ? 269 - (i % 4) * 83 : (i % 4) * 83,
        y: Math.floor(i / 4) * 48,
        width: 75,
        height: 40,
      });
  },
);

it('detects the old compatibility-mode measurement despite correct final pill positions', () => {
  const { tree } = wrapped();
  const oldTree = JSON.parse(JSON.stringify(tree)) as HostNode;
  for (const node of hostNodes(oldTree))
    if (String(node.props.testID).startsWith('pill')) {
      node.props.style = [node.props.style, { flexDirection: 'row' }];
      const content = node.children?.find(
        (child): child is HostNode => typeof child === 'object' && child.type === 'View',
      );
      expect(content).toBeTruthy();
      content!.props.style = [content!.props.style, { flexGrow: 1 }];
    }
  const boxes = yoga.layout(oldTree);
  expect(boxes.get('grid')?.height).toBe(568);
  expect(boxes.get('pill11')).toEqual({ x: 249, y: 96, width: 75, height: 40 });
});

it('keeps wrapped geometry stable while loading retains the content', () => {
  const normal = wrapped(false),
    busy = wrapped(true);
  expect(yoga.layout(busy.tree)).toEqual(yoga.layout(normal.tree));
});

it.each(['row', 'row-reverse', 'column', 'column-reverse'] as const)(
  'keeps %s full-size content justification and caller dimensions',
  (direction) => {
    const api = render(
      <BloomThemeProvider>
        <View testID="root" style={{ width: 200 }}>
          <Button
            material="flat"
            testID="button"
            style={{
              width: 200,
              height: 100,
              padding: 0,
              paddingHorizontal: 0,
              borderWidth: 0,
              flexDirection: direction,
              justifyContent: 'space-between',
            }}
          >
            <Text testID="first">One</Text>
            <Text testID="last">Two</Text>
          </Button>
        </View>
      </BloomThemeProvider>,
    );
    const boxes = yoga.layout(findHost(api.toJSON(), 'root')!);
    expect(boxes.get('button')).toMatchObject({ width: 200, height: 100 });
    const row = direction.startsWith('row'),
      reverse = direction.endsWith('reverse');
    const axis = row ? 'x' : 'y',
      end = row ? 160 : 80;
    expect(boxes.get('first')![axis]).toBe(reverse ? end : 0);
    expect(boxes.get('last')![axis]).toBe(reverse ? 0 : end);
  },
);

it('bounds a long native label and preserves icon slot gaps', () => {
  const api = render(
    <BloomThemeProvider>
      <View testID="root" style={{ width: 344 }}>
        <Button material="flat" testID="long" style={pill}>
          <Text style={{ flexShrink: 1 }}>Long label</Text>
        </Button>
        <View style={{ flexDirection: 'row' }}>
          <Button
            material="flat"
            testID="icon"
            style={{ ...pill, gap: 8 }}
            leading={<View style={{ width: 20, height: 20 }} />}
          >
            <Text>Label</Text>
          </Button>
        </View>
      </View>
    </BloomThemeProvider>,
  );
  const tree = findHost(api.toJSON(), 'root')!;
  expect(yoga.layout(tree, false, 800).get('long')).toMatchObject({ width: 344, height: 40 });
  expect(yoga.layout(tree).get('icon')).toMatchObject({ width: 103, height: 40 });
});

it('preserves full-width class-driven distribution through the native CSS resolver', () => {
  StyleCollection.styles.clear();
  StyleCollection.inject(
    compile(
      '.distributed { width: 100%; height: 48px; padding: 0 16px; border-width: 0; flex-direction: row; justify-content: space-between; }',
    ).stylesheet(),
  );
  const api = render(
    <BloomThemeProvider>
      <View testID="root" style={{ width: 344 }}>
        <Button material="flat" className="distributed" testID="distributed">
          <Text testID="start">Start</Text>
          <Text testID="end">End</Text>
        </Button>
      </View>
    </BloomThemeProvider>,
  );
  const boxes = yoga.layout(findHost(api.toJSON(), 'root')!);
  expect(boxes.get('distributed')).toMatchObject({ width: 344, height: 48 });
  expect(boxes.get('start')?.x).toBe(0);
  expect(boxes.get('end')?.x).toBe(272);
});

it.each(['flex-start', 'center', 'flex-end', 'stretch'] as const)(
  'retains vertical %s alignment in a tall native button',
  (alignItems) => {
    const api = render(
      <BloomThemeProvider>
        <View testID="root" style={{ width: 200 }}>
          <Button
            material="flat"
            style={{
              width: 200,
              height: 100,
              padding: 0,
              paddingHorizontal: 0,
              borderWidth: 0,
              alignItems,
            }}
          >
            <View testID="child" style={{ width: 40 }} />
          </Button>
        </View>
      </BloomThemeProvider>,
    );
    const box = yoga.layout(findHost(api.toJSON(), 'root')!).get('child')!;
    expect(box.y).toBe(alignItems === 'flex-end' ? 100 : alignItems === 'center' ? 50 : 0);
    expect(box.height).toBe(alignItems === 'stretch' ? 100 : 0);
  },
);

it.each([75, 200, 343.5])('reflows intrinsic controls when viewport width becomes %s', (width) => {
  const { tree } = wrapped();
  tree.props.style = { width };
  const boxes = yoga.layout(tree, false, width === 343.5 ? 40.125 : 40);
  const columns = width === 75 ? 1 : width === 200 ? 2 : 4;
  const rows = Math.ceil(12 / columns);
  expect(boxes.get('grid')?.height).toBe(rows * 40 + (rows - 1) * 8);
  expect(boxes.get('pill11')?.y).toBe((rows - 1) * 48);
  expect(boxes.get('pill0')?.width).toBeCloseTo(width === 343.5 ? 75.125 : 75);
});
