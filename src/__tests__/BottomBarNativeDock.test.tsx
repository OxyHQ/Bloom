import { act, render } from '@testing-library/react-native';
import { I18nManager, TextInput, View } from 'react-native';
import { BottomBarBase } from '../bottom-bar/BottomBarBase';
import { createTabBar, createTabBarButton } from '../tab-bar/TabBarBase';
import type { BottomBarProps } from '../bottom-bar/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, resolvedStyle } from './support/rendered-style';
import { createYogaHostRenderer } from './support/yoga-host-tree';
import { mockWindowSize } from './support/window-size';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Expected native dock host or measured box');
  return value;
}

const Blur = () => null;
const Navigation = createTabBar(Blur);
const Item = createTabBarButton(() => <View style={{ width: 24, height: 24 }} />);
const items = ['home', 'videos', 'notifications', 'profile'].map((name) => ({
  name,
  label: name,
  icon: null,
}));
let yoga: ReturnType<typeof createYogaHostRenderer>;
beforeAll(() => {
  yoga = createYogaHostRenderer();
}, 120_000);
afterAll(() => yoga?.dispose());
afterEach(() => jest.restoreAllMocks());

/** Real Yoga geometry over production native styles, with explicit editor height.
 * Shared-value samples are static; this does not simulate Fabric, IME or the UI clock. */
it.each([
  [44, 8],
  [104, 8],
  [44, 12],
  [104, 12],
])('keeps a %ipx editor with %ipx gutters in bounds through folding', (height, horizontalInset) => {
  mockWindowSize({ width: 390, height: 844 });
  for (const rtl of [false, true]) {
    const previousDirection = I18nManager.isRTL;
    I18nManager.isRTL = rtl;
    const progress = { value: 0 } as NonNullable<BottomBarProps['minimizeProgress']>;
    let navigationVisibility: BottomBarProps['navigationVisibility'] = 'always';
    const element = () => (
      <BloomThemeProvider mode="light">
        <View testID="fixture" style={{ width: 390 }}>
          <BottomBarBase
            Navigation={Navigation}
            Item={Item}
            Blur={Blur}
            items={items}
            value="videos"
            onValueChange={() => {}}
            actionBehavior="dock"
            minimizeProgress={progress}
            testID="dock"
            horizontalInset={horizontalInset}
            navigationVisibility={navigationVisibility}
            action={<TextInput testID="editor" style={{ height }} value="Retained reply" />}
          />
        </View>
      </BloomThemeProvider>
    );
    const view = render(element());
    const editor = view.getByTestId('editor');
    try {
      const initial = yoga.layout(required(findHost(view.toJSON(), 'fixture')), rtl);
      expect(required(initial.get('dock-navigation')).width).toBeCloseTo(
        390 - horizontalInset * 2,
        3,
      );
      act(() => {
        view
          .getByTestId('dock-row')
          .props.onLayout({ nativeEvent: { layout: { width: 390, height: 200 } } });
      });
      for (const amount of [0, 0.3, 0.6, 0.8, 1, 0]) {
        progress.value = amount;
        view.rerender(element());
        const root = required(findHost(view.toJSON(), 'fixture'));
        const boxes = yoga.layout(root, rtl);
        const action = required(boxes.get('dock-action'));
        const navigation = required(boxes.get('dock-navigation'));
        const input = required(boxes.get('editor'));
        const actionStyle = resolvedStyle(required(findHost(root, 'dock-action')).props.style);
        const transforms = actionStyle.transform as { translateY?: number }[] | undefined;
        const translatedY =
          action.y +
          (transforms?.reduce((sum, transform) => sum + (transform.translateY ?? 0), 0) ?? 0);
        expect(view.getByTestId('editor')).toBe(editor);
        expect(input.height).toBe(height);
        expect(action.x).toBeGreaterThanOrEqual(0);
        expect(action.x + action.width).toBeLessThanOrEqual(390);
        expect(action.width).toBeGreaterThan(200);
        const verticalOverlap =
          translatedY < navigation.y + navigation.height &&
          translatedY + action.height > navigation.y;
        if (verticalOverlap) {
          const gap = rtl
            ? navigation.x - (action.x + action.width)
            : action.x - (navigation.x + navigation.width);
          expect(gap).toBeCloseTo(10, 3);
        }
        expect(navigation.x).toBeCloseTo(
          rtl ? 390 - horizontalInset - navigation.width : horizontalInset,
          3,
        );
        if (amount === 1)
          expect(translatedY + action.height).toBeCloseTo(navigation.y + navigation.height, 3);
      }
      navigationVisibility = 'never';
      view.rerender(element());
      const hidden = yoga.layout(required(findHost(view.toJSON(), 'fixture')), rtl);
      expect(required(hidden.get('dock-navigation')).width).toBe(0);
      expect(required(hidden.get('dock-navigation')).height).toBe(0);
      expect(required(hidden.get('dock-action')).width).toBe(390 - horizontalInset * 2);
      expect(required(hidden.get('editor')).height).toBe(height);
      expect(view.getByTestId('editor')).toBe(editor);
    } finally {
      view.unmount();
      I18nManager.isRTL = previousDirection;
    }
  }
});
