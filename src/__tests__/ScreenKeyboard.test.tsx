import { createRef, type Ref, type ComponentRef } from 'react';
import { Keyboard, Platform, View, type ScrollView } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Screen, ScreenScrollView } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from '../../__mocks__/react-native-keyboard-controller';

jest.mock('react-native-keyboard-controller', () => ({
  ...jest.requireActual('../../__mocks__/react-native-keyboard-controller'),
  // Deliberately distinct from React Native's test window: use the same
  // coordinate space as the controller that performs focused-input scrolling.
  useWindowDimensions: () => ({ width: 400, height: 900 }),
}));

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

function fixture(active = true, scrollRef?: Ref<ComponentRef<typeof ScrollView>>) {
  return (
    <BloomThemeProvider fonts={false}>
      <Screen
        testID="editor"
        scroll="auto"
        active={active}
        header={<View />}
        bottomBar={<View />}
        bottomBarKeyboardBehavior="follow"
        contentClearance={48}
      >
        <ScreenScrollView ref={scrollRef} testID="body" keyboardShouldPersistTaps="handled" />
      </Screen>
    </BloomThemeProvider>
  );
}

it.each(['ios', 'android'] as const)(
  'coordinates focused-input scrolling and the measured keyboard footer on %s',
  (platform) => {
    Platform.OS = platform;
    const tree = render(fixture());
    fireEvent(tree.getByTestId('editor-header'), 'layout', {
      nativeEvent: { layout: { height: 56 } },
    });
    fireEvent(tree.getByTestId('editor-bottom'), 'layout', {
      nativeEvent: { layout: { height: 72 } },
    });
    const scroll = tree.UNSAFE_getByType(KeyboardAwareScrollView);
    expect(scroll.props).toMatchObject({
      bottomOffset: 72,
      extraKeyboardSpace: 72,
      enabled: true,
      keyboardShouldPersistTaps: 'handled',
    });
    expect(resolvedStyle(scroll.props.contentContainerStyle)).toMatchObject({
      paddingTop: 0,
      paddingBottom: 120,
    });
    expect(resolvedStyle(tree.getByTestId('editor-content').props.style)).toMatchObject({
      paddingTop: 56,
      paddingBottom: 0,
    });
    expect(tree.UNSAFE_getByType(KeyboardStickyView).props.enabled).toBe(true);
    fireEvent(tree.getByTestId('editor-bottom'), 'layout', {
      nativeEvent: { layout: { height: 108 } },
    });
    expect(scroll.props.bottomOffset).toBe(108);
    expect(scroll.props.extraKeyboardSpace).toBe(108);
    expect(resolvedStyle(scroll.props.contentContainerStyle).paddingBottom).toBe(156);
    act(() => tree.rerender(fixture(false)));
    expect(scroll.props.enabled).toBe(false);
    expect(tree.UNSAFE_getByType(KeyboardStickyView).props.enabled).toBe(false);
  },
);

it.each([
  ['window-filling', 0, 900, 72],
  ['inset dialog', 32, 812, 128],
  ['nested panel', 260, 500, 212],
] as const)('keeps the %s viewport and footer clearances distinct', (_name, y, height, offset) => {
  Platform.OS = 'android';
  const scrollTo = jest.fn();
  let measuredY: number = y;
  let measuredHeight: number = height;
  const native = {
    measureInWindow: jest.fn((callback) => callback(0, measuredY, 400, measuredHeight)),
  };
  const assureFocusedInputVisible = jest.fn();
  const handle = { getNativeScrollRef: () => native, scrollTo, assureFocusedInputVisible };
  const forwarded = createRef<ComponentRef<typeof ScrollView>>();
  const tree = render(fixture(true, forwarded), {
    createNodeMock: (element) => (element.type === 'KeyboardAwareScrollView' ? handle : null),
  });
  fireEvent(tree.getByTestId('editor-bottom'), 'layout', {
    nativeEvent: { layout: { height: 72 } },
  });
  const scroll = tree.UNSAFE_getByType(KeyboardAwareScrollView);
  expect(scroll.props.bottomOffset).toBe(offset);
  expect(scroll.props.extraKeyboardSpace).toBe(offset);
  // Follow owns an overlaid footer: it reserves content, not viewport height.
  expect(resolvedStyle(tree.getByTestId('editor-content').props.style).paddingBottom).toBe(0);
  expect(forwarded.current).toBe(handle);
  forwarded.current?.scrollTo({ y: 30, animated: false });
  expect(scrollTo).toHaveBeenCalledWith({ y: 30, animated: false });

  // The controller owns both IME-show reveal and bottomOffset synchronization.
  // Bloom must pass the measured clearance without requesting a second scroll.
  const subscriptions = (Keyboard.addListener as jest.Mock).mock.calls;
  act(() => {
    for (const [event, listener] of subscriptions) {
      if (event === 'keyboardDidShow') {
        listener({ endCoordinates: { height: 320, screenY: 580 } });
      }
    }
  });

  // An ancestor can move this viewport without changing its own local layout.
  measuredY = 80;
  measuredHeight = 700;
  fireEvent(scroll, 'touchStart', { nativeEvent: {} });
  expect(scroll.props.bottomOffset).toBe(192);
  expect(scroll.props.extraKeyboardSpace).toBe(192);
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingBottom).toBe(120);
  expect(assureFocusedInputVisible).not.toHaveBeenCalled();
});

it('does not mount native keyboard surfaces on web', () => {
  Platform.OS = 'web';
  const tree = render(fixture());
  expect(tree.UNSAFE_queryByType(KeyboardAwareScrollView)).toBeNull();
  expect(tree.UNSAFE_queryByType(KeyboardStickyView)).toBeNull();
});

it.each(['web', 'ios', 'android'] as const)(
  'reserves measured chrome around a non-scrolling canvas on %s',
  (platform) => {
    Platform.OS = platform;
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <Screen testID="canvas" scroll="none" header={<View />} bottomBar={<View />}>
          <View testID="board" style={{ flex: 1 }} />
        </Screen>
      </BloomThemeProvider>,
    );
    fireEvent(tree.getByTestId('canvas-header'), 'layout', {
      nativeEvent: { layout: { height: 80 } },
    });
    fireEvent(tree.getByTestId('canvas-bottom'), 'layout', {
      nativeEvent: { layout: { height: 60 } },
    });
    expect(resolvedStyle(tree.getByTestId('canvas-content').props.style)).toMatchObject({
      flexGrow: 1,
      minHeight: 0,
      paddingTop: 80,
      paddingBottom: 76,
    });
    expect(tree.queryByTestId('canvas-viewport')).toBeNull();
    expect(tree.getByTestId('board')).toBeTruthy();
  },
);
