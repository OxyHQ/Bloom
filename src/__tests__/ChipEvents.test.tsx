/**
 * `Chip`'s press, long-press and hover events.
 *
 * A chip inside a pressable card could not stop its press reaching the card:
 * `onPress` was called with no event, so there was nothing to stop. These pin
 * the event through, `stopPropagation`, `onLongPress` and the hover callbacks.
 */
import type React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Chip } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderChip(props: React.ComponentProps<typeof Chip>) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Chip testID="chip" {...props} />
    </BloomThemeProvider>,
  );
}

const pressEvent = () => ({ nativeEvent: {}, stopPropagation: jest.fn() });

describe('Chip onPress', () => {
  it('hands the press event to onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderChip({ onPress, children: 'Design' });
    const event = pressEvent();
    fireEvent.press(getByTestId('chip'), event);
    expect(onPress).toHaveBeenCalledWith(event);
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('stops the press reaching a parent with stopPropagation', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderChip({ onPress, stopPropagation: true, children: 'Design' });
    const event = pressEvent();
    fireEvent.press(getByTestId('chip'), event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a removable chip stops its selection press as well', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderChip({
      onPress,
      onClose: () => {},
      stopPropagation: true,
      children: 'Design',
    });
    const event = pressEvent();
    fireEvent.press(getByTestId('chip'), event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(event);
  });
});

describe('Chip onLongPress', () => {
  it('makes the chip interactive and hands the event over, stopped on request', () => {
    const onLongPress = jest.fn();
    const { getByTestId } = renderChip({ onLongPress, stopPropagation: true, children: 'Tag' });
    const chip = getByTestId('chip');
    expect(chip.props.role).toBe('button');
    const event = pressEvent();
    fireEvent(chip, 'longPress', event);
    expect(onLongPress).toHaveBeenCalledWith(event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('a disabled chip installs no long-press handler', () => {
    const { getByTestId } = renderChip({ onLongPress: () => {}, disabled: true, children: 'Tag' });
    expect(getByTestId('chip').props.onLongPress).toBeUndefined();
  });
});

describe('Chip hover callbacks', () => {
  it('reports hover in and out on an interactive chip', () => {
    const onHoverIn = jest.fn();
    const onHoverOut = jest.fn();
    const { getByTestId } = renderChip({
      onPress: () => {},
      onHoverIn,
      onHoverOut,
      children: 'Design',
    });
    const chip = getByTestId('chip');
    const event = { nativeEvent: {} };
    act(() => chip.props.onHoverIn(event));
    expect(onHoverIn).toHaveBeenCalledWith(event);
    act(() => chip.props.onHoverOut(event));
    expect(onHoverOut).toHaveBeenCalledWith(event);
  });

  it('a disabled chip reports no hover in, but still reports the way out', () => {
    const onHoverIn = jest.fn();
    const onHoverOut = jest.fn();
    const { getByTestId } = renderChip({
      onPress: () => {},
      disabled: true,
      onHoverIn,
      onHoverOut,
      children: 'Design',
    });
    const chip = getByTestId('chip');
    act(() => chip.props.onHoverIn({ nativeEvent: {} }));
    act(() => chip.props.onHoverOut({ nativeEvent: {} }));
    expect(onHoverIn).not.toHaveBeenCalled();
    expect(onHoverOut).toHaveBeenCalledTimes(1);
  });

  it('still wires no hover on a plain filled chip that asked for none', () => {
    const { getByTestId } = renderChip({ onPress: () => {}, children: 'Design' });
    expect(getByTestId('chip').props.onHoverIn).toBeUndefined();
  });
});
