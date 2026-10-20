import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform, Text, StyleSheet } from 'react-native';
import { StyledView } from '../../styles/styled-primitives';
import { GestureDetector } from 'react-native-gesture-handler';
import type { MockGesture } from '../../../__mocks__/react-native-gesture-handler';
import { BoardDragContext, BoardDragHandle, type BoardDragBinding } from '../BoardGesture';

function setup(overrides: Partial<BoardDragBinding> = {}, onPress = jest.fn()) {
  const binding: BoardDragBinding = {
    nativeID: 'occurrence',
    enabled: true,
    allowReorder: false,
    onStart: jest.fn(),
    onUpdate: jest.fn(),
    onEnd: jest.fn(),
    onAccessibleMove: jest.fn(),
    suppressOpen: () => false,
    ...overrides,
  };
  const screen = render(
    <BoardDragContext.Provider value={binding}>
      <BoardDragHandle accessibilityLabel="Move Alpha" onPress={onPress} style={{ flex: 1 }}>
        <Text>Alpha</Text>
      </BoardDragHandle>
    </BoardDragContext.Provider>,
  );
  const gesture = binding.enabled
    ? (screen.UNSAFE_getByType(GestureDetector).props.gesture as MockGesture)
    : undefined;
  return { binding, screen, gesture, onPress };
}
function fire(gesture: MockGesture, name: string, ...args: unknown[]) {
  act(() => (gesture.__handlers[name] as (...args: unknown[]) => void)(...args));
}

it('uses the template pan thresholds on native and finalizes only a started gesture', () => {
  const { gesture, binding } = setup();
  expect(gesture?.__config).toMatchObject({
    enabled: true,
    minDistance: 5,
    activateAfterLongPress: Platform.OS === 'web' ? 0 : 180,
    touchAction: 'none',
  });
  fire(gesture!, 'onFinalize', {}, false);
  expect(binding.onEnd).not.toHaveBeenCalled();
  fire(gesture!, 'onStart', { absoluteX: 20, absoluteY: 30 });
  fire(gesture!, 'onUpdate', { absoluteX: 200, absoluteY: 50 });
  fire(gesture!, 'onFinalize', {}, false);
  expect(binding.onStart).toHaveBeenCalledWith(20, 30);
  expect(binding.onUpdate).toHaveBeenCalledWith(200, 50);
  expect(binding.onEnd).toHaveBeenCalledWith(false);
});

it('preserves normal activation, blocks landing activation, and exposes only allowed move actions', () => {
  let suppress = false;
  const { screen, onPress, binding } = setup({ suppressOpen: () => suppress });
  const handle = screen.getByLabelText('Move Alpha');
  const event = { stopPropagation: jest.fn() };
  fireEvent.press(handle, event);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  suppress = true;
  fireEvent.press(handle, event);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(handle.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual([
    'nextColumn',
    'previousColumn',
  ]);
  fireEvent(handle, 'accessibilityAction', { nativeEvent: { actionName: 'nextColumn' } });
  expect(binding.onAccessibleMove).toHaveBeenCalledWith('next');
});

it('puts flex sizing on the outer handle container and removes gesture controls in read-only mode', () => {
  const { screen } = setup();
  const detector = screen.UNSAFE_getByType(GestureDetector);
  expect(StyleSheet.flatten(detector.parent?.props.style)).toMatchObject({ flex: 1, minWidth: 0 });
  screen.unmount();
  const disabled = setup({ enabled: false });
  expect(disabled.screen.queryByRole('button', { name: 'Move Alpha' })).toBeNull();
  expect(disabled.screen.getByText('Alpha')).toBeTruthy();
});

it('attaches the recognizer to a neutral host so web pointer capture survives leaving the accessible button', () => {
  const { screen } = setup();
  const host = screen.UNSAFE_getByType(GestureDetector).props.children;
  expect(host.type).toBe(StyledView);
  expect(host.props.collapsable).toBe(false);
  expect(host.props.accessibilityRole).toBeUndefined();
  expect(host.props.role).toBeUndefined();
  expect(screen.getByLabelText('Move Alpha').props.accessibilityRole).toBe('button');
});
