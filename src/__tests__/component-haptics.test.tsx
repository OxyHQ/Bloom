/**
 * The controls a finger operates answer it through `useHapticFeedback`, so the
 * viewer's `haptics` preference and `BloomHapticsProvider` reach them: a touch
 * that changes the value ticks, one that changes nothing does not, and the
 * keyboard's or an assistive technology's adjustments stay silent.
 */
import type React from 'react';
import { PanResponder } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomHapticsProvider } from '../hooks/use-haptics';
import { RatingInput } from '../rating';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Slider } from '../slider';
import { Stepper } from '../stepper';
import { Switch } from '../switch';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const selectionAsync = jest.fn(async () => undefined);
jest.mock('../hooks/haptics-module', () => ({
  loadHaptics: () => ({
    impactAsync: jest.fn(async () => undefined),
    selectionAsync,
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  }),
  warnHapticsUnavailable: jest.fn(),
}));

function renderIn(ui: React.ReactElement, enabled = true) {
  return render(
    <BloomThemeProvider>
      <BloomHapticsProvider enabled={enabled}>{ui}</BloomHapticsProvider>
    </BloomThemeProvider>,
  );
}

beforeEach(() => selectionAsync.mockClear());

describe('haptics on the controls a finger operates', () => {
  it('Switch ticks as it toggles, and not under a disabled provider', () => {
    const view = renderIn(<Switch accessibilityLabel="Wi-Fi" testID="switch" />);
    fireEvent.press(view.getByTestId('switch'));
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    view.unmount();

    const off = renderIn(<Switch accessibilityLabel="Wi-Fi" testID="switch" />, false);
    fireEvent.press(off.getByTestId('switch'));
    expect(selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('Stepper ticks on a press that moves the value; adjustments stay silent', () => {
    const view = renderIn(
      <Stepper value={1} max={1} onValueChange={() => {}} accessibilityLabel="Guests" testID="s" />,
    );
    fireEvent.press(view.getByTestId('s-increment'));
    expect(selectionAsync).not.toHaveBeenCalled();
    fireEvent.press(view.getByTestId('s-decrement'));
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    fireEvent(view.getByTestId('s-value'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('RatingInput and SegmentedControl tick when a press changes the choice', () => {
    const rating = renderIn(
      <RatingInput value={2} onChange={() => {}} accessibilityLabel="Rate" />,
    );
    fireEvent.press(rating.getByLabelText('2 stars'));
    expect(selectionAsync).not.toHaveBeenCalled();
    fireEvent.press(rating.getByLabelText('4 stars'));
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    rating.unmount();

    const segments = renderIn(
      <SegmentedControl label="View" type="radio" value="a" onValueChange={() => {}}>
        <SegmentedControlItem value="a" testID="a">
          <SegmentedControlItemText>A</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="b" testID="b">
          <SegmentedControlItemText>B</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    fireEvent.press(segments.getByTestId('a'));
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    fireEvent.press(segments.getByTestId('b'));
    expect(selectionAsync).toHaveBeenCalledTimes(2);
  });

  it('Slider ticks per step only while its steps are detents, and at its ends', () => {
    const create = jest.spyOn(PanResponder, 'create');
    function drag(max: number, step: number, to: number) {
      create.mockClear();
      const view = renderIn(
        <Slider value={0} max={max} step={step} onValueChange={() => {}} accessibilityLabel="V" />,
      );
      const track = view.UNSAFE_root.findAll(
        (node) => typeof node.props.onLayout === 'function' && node.props.style?.height === 32,
      )[0]!;
      act(() => track.props.onLayout({ nativeEvent: { layout: { width: 100 } } }));
      const config = create.mock.results[create.mock.results.length - 1]!.value._config as {
        onPanResponderGrant: (event: unknown) => void;
      };
      act(() => config.onPanResponderGrant({ nativeEvent: { locationX: to } }));
      view.unmount();
    }

    drag(10, 1, 30); // ten detents: a step ticks
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    drag(100, 1, 30); // a hundred: a step is too fine to tick
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    drag(100, 1, 100); // but reaching an end does
    expect(selectionAsync).toHaveBeenCalledTimes(2);
    create.mockRestore();
  });
});
