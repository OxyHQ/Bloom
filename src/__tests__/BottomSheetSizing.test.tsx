import type React from 'react';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { BottomSheetBase } from '../bottom-sheet/BottomSheetBase';
import BottomSheet from '../bottom-sheet/BottomSheet';
import type { BottomSheetProps, BottomSheetShellProps } from '../bottom-sheet/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen } from '../screen';
import { ScreenScrollView } from '../screen/ScreenScrollView';
import { hostNodes, resolvedStyle } from './support/rendered-style';

let mockHeight = 800;
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useWindowDimensions: () => ({ width: 390, height: mockHeight, scale: 1, fontScale: 1 }),
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('../../__mocks__/react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));
let keyboard: SharedValue<number>;
function Shell({ children, keyboardHeight }: BottomSheetShellProps) {
  keyboard = keyboardHeight;
  return <>{children}</>;
}
function Body() {
  const [draft, setDraft] = useState('Draft');
  return (
    <Screen scroll="none">
      <TextInput testID="draft" value={draft} onChangeText={setDraft} />
    </Screen>
  );
}
const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);
const panel = (tree: unknown) =>
  resolvedStyle(
    hostNodes(tree).find((n) => resolvedStyle(n.props.style).maxWidth === 800)?.props.style,
  );
beforeEach(() => {
  mockHeight = 800;
});

it('bounds a flex screen using the existing safe-area and keyboard geometry without losing its draft', () => {
  const props = { open: true, detached: true, scrollable: false, sizing: 'fill' as const };
  const draw = () => (
    <BottomSheetBase {...props} Shell={Shell}>
      <Body />
    </BottomSheetBase>
  );
  const view = render(draw(), { wrapper });
  // 24+16 above, 12+16 below; both are the existing detached edge rule.
  expect(panel(view.toJSON()).height).toBe(732);
  expect(panel(view.toJSON()).maxHeight).toBe(732);
  fireEvent.changeText(view.getByTestId('draft'), 'Keep this draft');
  act(() => {
    keyboard.value = 260;
  });
  view.rerender(draw());
  expect(panel(view.toJSON()).height).toBe(472);
  expect(view.getByTestId('draft').props.value).toBe('Keep this draft');
  mockHeight = 640;
  view.rerender(draw());
  // The test animation mock applies shared-value effects on the next render.
  view.rerender(draw());
  expect(panel(view.toJSON()).height).toBe(312);
  expect(view.getByTestId('draft').props.value).toBe('Keep this draft');
  act(() => {
    keyboard.value = 1000;
  });
  view.rerender(draw());
  expect(panel(view.toJSON()).height).toBe(0);
});

it.each([undefined, 'content'] as const)(
  'keeps intrinsic sizing for %s and existing explicit height precedence',
  (sizing) => {
    const draw = (style?: BottomSheetProps['style']) => (
      <BottomSheetBase open sizing={sizing} style={style} Shell={Shell}>
        <Body />
      </BottomSheetBase>
    );
    const view = render(draw(), { wrapper });
    expect(panel(view.toJSON()).height).toBeUndefined();
    expect(panel(view.toJSON()).maxHeight).toBe(776);
    act(() => {
      keyboard.value = 200;
    });
    view.rerender(draw());
    expect(panel(view.toJSON()).height).toBeUndefined();
    expect(panel(view.toJSON()).maxHeight).toBe(576);
    view.rerender(draw({ height: 300 }));
    expect(panel(view.toJSON()).height).toBe(300);
  },
);

it('passes the fill contract through the explicit native modal owner', () => {
  const view = render(
    <BottomSheet open sizing="fill" detached scrollable={false}>
      <Body />
    </BottomSheet>,
    { wrapper },
  );
  expect(panel(view.toJSON()).height).toBe(732);
  expect(view.getByTestId('draft')).toBeTruthy();
});

it('lets the native screen and its sole scroller contribute content size below the sheet ceiling', () => {
  const draw = (sizing: 'content' | 'fill') => (
    <BottomSheet open sizing={sizing} detached scrollable={false}>
      <Screen
        scroll="auto"
        testID="native-screen"
        header={<View />}
        bottomBar={<View />}
        contentClearance={0}
      >
        <ScreenScrollView testID="native-scroll" style={{ flex: 1 }}>
          <TextInput testID="native-draft" defaultValue="Keep" />
        </ScreenScrollView>
      </Screen>
    </BottomSheet>
  );
  const view = render(draw('content'), { wrapper });
  expect(panel(view.toJSON()).height).toBeUndefined();
  expect(panel(view.toJSON()).maxHeight).toBe(732);
  expect(resolvedStyle(view.getByTestId('native-screen').props.style).flexBasis).toBe('auto');
  expect(resolvedStyle(view.getByTestId('native-scroll').props.style).flexBasis).toBe('auto');
  fireEvent(view.getByTestId('native-screen-header'), 'layout', {
    nativeEvent: { layout: { height: 48 } },
  });
  fireEvent(view.getByTestId('native-screen-bottom'), 'layout', {
    nativeEvent: { layout: { height: 88 } },
  });
  expect(resolvedStyle(view.getByTestId('native-screen-content').props.style)).toMatchObject({
    paddingTop: 48,
    paddingBottom: 88,
  });
  const draft = view.getByTestId('native-draft');
  view.rerender(draw('fill'));
  expect(panel(view.toJSON()).height).toBe(732);
  expect(view.getByTestId('native-draft')).toBe(draft);
});
