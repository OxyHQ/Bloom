import { Platform, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Screen, ScreenScrollView } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from '../../__mocks__/react-native-keyboard-controller';

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

function fixture(active = true) {
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
        <ScreenScrollView testID="body" keyboardShouldPersistTaps="handled" />
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
