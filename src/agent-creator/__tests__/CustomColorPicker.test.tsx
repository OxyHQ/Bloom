import { GestureDetector } from 'react-native-gesture-handler';
import { act, fireEvent, render } from '@testing-library/react-native';
import Svg, { Stop } from 'react-native-svg';
import { Field } from '../../field';
import { normalizeAvatarSkinColor, AVATAR_SKIN_MIN_TONE } from '../../agent-avatar/skin-color';
import { argbFromHex, lstarFromArgb } from '../../theme/color-engine/color-utils';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { CustomColorPicker } from '../CustomColorPicker';

it('normalizes typed dark hex and immediately shows the actual permitted value', () => {
  const change = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <CustomColorPicker value="#ffa500" onChange={change} />
    </BloomThemeProvider>,
  );
  fireEvent.changeText(view.getByLabelText('Hex color'), '#000000');
  fireEvent(view.getByLabelText('Hex color'), 'submitEditing');
  const safe = normalizeAvatarSkinColor('#000000');
  expect(change).toHaveBeenLastCalledWith(safe);
  expect(view.getByLabelText('Hex color').props.value).toBe(safe);
  expect(lstarFromArgb(argbFromHex(safe))).toBeGreaterThanOrEqual(AVATAR_SKIN_MIN_TONE);
});

it('paints only permitted field samples, including its bottom edge', () => {
  const view = render(
    <BloomThemeProvider>
      <CustomColorPicker value="#000000" onChange={jest.fn()} />
    </BloomThemeProvider>,
  );
  const field = view
    .UNSAFE_getAllByType(Svg)
    .find((node) => node.props.testID === 'avatar-skin-color-field')!;
  const stops = field.findAllByType(Stop);
  expect(stops.length).toBeGreaterThan(100);
  for (const stop of stops) {
    expect(lstarFromArgb(argbFromHex(stop.props.stopColor))).toBeGreaterThanOrEqual(
      AVATAR_SKIN_MIN_TONE,
    );
  }
});

it('does not commit a typed value while the enclosing field is disabled', () => {
  const change = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <Field label="Skin" disabled>
        <CustomColorPicker value="#ffa500" onChange={change} />
      </Field>
    </BloomThemeProvider>,
  );
  fireEvent.changeText(view.getByLabelText('Skin'), '#000000');
  fireEvent(view.getByLabelText('Skin'), 'submitEditing');
  expect(change).not.toHaveBeenCalled();
});

it('drops pending gesture paint when disabled, uses latest callback and cancels unmounted work', () => {
  const originalRequest = global.requestAnimationFrame,
    originalCancel = global.cancelAnimationFrame;
  let queued: FrameRequestCallback | undefined;
  global.requestAnimationFrame = jest.fn((callback) => {
    queued = callback;
    return 17;
  });
  global.cancelAnimationFrame = jest.fn();
  const first = jest.fn(),
    next = jest.fn(),
    ended = jest.fn();
  const ui = (disabled: boolean, change: (hex: string) => void) => (
    <BloomThemeProvider>
      <Field label="Skin" disabled={disabled}>
        <CustomColorPicker value="#ffa500" onChange={change} onInteractionEnd={ended} />
      </Field>
    </BloomThemeProvider>
  );
  const view = render(ui(false, first));
  try {
    const gesture = () => view.UNSAFE_getAllByType(GestureDetector)[0]!.props.gesture;
    act(() => gesture().__handlers.onBegin({ x: 80, y: 50 }));
    view.rerender(ui(true, next));
    act(() => gesture().__handlers.onFinalize());
    expect(first).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(ended).toHaveBeenCalledTimes(1);
    view.rerender(ui(false, next));
    act(() => gesture().__handlers.onBegin({ x: 100, y: 30 }));
    act(() => queued?.(0));
    expect(next).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    act(() => gesture().__handlers.onUpdate({ x: 150, y: 20 }));
    view.unmount();
    expect(global.cancelAnimationFrame).toHaveBeenCalledWith(17);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ended).toHaveBeenCalledTimes(2);
  } finally {
    global.requestAnimationFrame = originalRequest;
    global.cancelAnimationFrame = originalCancel;
  }
});
