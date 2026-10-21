import React from 'react';
import { Keyboard, Text, type View, type KeyboardEvent as NativeKeyboardEvent } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SuggestionPanel } from '../chat-composer/SuggestionPanel';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';
jest.mock('../portal', () => ({
  Portal: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Keyboard: { ...jest.requireActual('react-native').Keyboard, metrics: () => undefined },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('../../__mocks__/react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);
it('uses the same placement resolver without a modal or keyboard-blurring backdrop, bounded above the keyboard', () => {
  const listeners = new Map<string, (event: NativeKeyboardEvent) => unknown>();
  const listener = jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    listeners.set(name, callback);
    return { remove: jest.fn() };
  });
  const close = jest.fn();
  const anchor = {
    contextRef: React.createRef<React.ComponentRef<typeof View>>(),
    getRect: () => ({ top: 400, bottom: 420, left: 20, right: 20 }),
  };
  const tree = render(
    <SuggestionPanel
      anchor={anchor}
      open
      onOpenChange={close}
      listboxId="options"
      label="Commands"
      maxHeight={320}
      scrollRef={React.createRef()}
      style={undefined}
      testID="panel"
    >
      <Text>Heading</Text>
    </SuggestionPanel>,
    { wrapper },
  );
  const keyboardEvent: NativeKeyboardEvent = {
    duration: 0,
    easing: 'keyboard',
    endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 },
  };
  act(() => listeners.get('keyboardDidShow')?.(keyboardEvent));
  fireEvent(tree.getByTestId('panel'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 180, x: 0, y: 0 } },
  });
  const nodes = hostNodes(tree.toJSON());
  const panel = nodes.find((node) => node.props.testID === 'panel')!;
  expect(resolvedStyle(panel.props.style).top).toBe(216);
  expect(resolvedStyle(panel.props.style).maxHeight).toBe(320);
  expect(nodes.filter((node) => node.props.keyboardShouldPersistTaps === 'always')).toHaveLength(1);
  expect(nodes.some((node) => node.props.accessibilityViewIsModal === true)).toBe(false);
  act(() => listeners.get('keyboardDidHide')?.(keyboardEvent));
  expect(close).toHaveBeenCalledWith(false);
  listener.mockRestore();
});
