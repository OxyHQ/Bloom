/**
 * `SortableChipRow`'s drag on Gesture Handler 3: each chip's pan, fired with
 * real event payloads after the chips are laid out, moves the chip to the one
 * nearest the finger; a disabled row's pans are off.
 */
import type React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { MockGesture } from '../../__mocks__/react-native-gesture-handler';

const mockDetected = new Map<string, MockGesture>();
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  return {
    ...actual,
    GestureDetector: (props: { gesture: MockGesture; children: React.ReactElement }) => {
      mockDetected.set((props.children.props as { testID: string }).testID, props.gesture);
      return actual.GestureDetector(props);
    },
  };
});

const { SortableChipRow } = require('../sortable-chip-row/SortableChipRow');

const items = () => ['a', 'b', 'c'].map((key) => ({ key, label: key.toUpperCase(), node: null }));

function mount(props: Record<string, unknown> = {}) {
  const onReorder = jest.fn();
  const onDragStateChange = jest.fn();
  const view = render(
    <SortableChipRow
      items={items()}
      onReorder={onReorder}
      onDragStateChange={onDragStateChange}
      {...props}
    />,
  );
  ['a', 'b', 'c'].forEach((key, index) =>
    fireEvent(view.getByTestId(`sortable-chip-${key}`), 'layout', {
      nativeEvent: { layout: { x: index * 48, y: 0, width: 40, height: 20 } },
    }),
  );
  return { onReorder, onDragStateChange };
}

const pan = (key: string) => mockDetected.get(`sortable-chip-${key}`) as MockGesture;

beforeEach(() => mockDetected.clear());

describe('SortableChipRow drag', () => {
  it('is a JS-thread pan that waits for the drag threshold', () => {
    mount();
    expect(pan('b').__config).toMatchObject({ runOnJS: true, enabled: true, minDistance: 6 });
  });

  it('moves the dragged chip to the one nearest the finger', () => {
    const { onReorder, onDragStateChange } = mount();
    act(() => pan('a').__handlers.onActivate?.({} as never));
    expect(onDragStateChange).toHaveBeenLastCalledWith(true);
    act(() => pan('a').__handlers.onUpdate?.({ translationX: 96, translationY: 0 } as never));
    act(() => pan('a').__handlers.onDeactivate?.({} as never));
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'c', 'a']);
    expect(onDragStateChange).toHaveBeenLastCalledWith(false);
  });

  it('is off while the row is disabled', () => {
    mount({ disabled: true });
    expect(pan('b').__config.enabled).toBe(false);
  });
});
