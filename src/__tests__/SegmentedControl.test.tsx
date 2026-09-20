/**
 * `type` is `SegmentedControl`'s one real decision, and it is an ACCESSIBILITY
 * one wearing visual clothes: `radio` picks a value, `tabs` switches the panel
 * below. The two render identically, so choosing wrong is invisible on screen
 * and wrong in every screen reader.
 *
 * The state spelling follows the role, and that is the part a prop-level test
 * cannot see: ARIA gives `tab` a SELECTED state and `radio` a CHECKED one, so
 * one spelling for both is invalid in one of the two modes — and
 * react-native-web drops `accessibilityState` entirely, so a control that set
 * only that would announce nothing at all on web.
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { GestureDetector } from 'react-native-gesture-handler';
import { pressHost } from './support/press-host';

function renderControl(
  type: 'radio' | 'tabs',
  value: 'a' | 'b',
  onChange: (next: 'a' | 'b') => void = () => {},
) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <SegmentedControl label="Section" type={type} value={value} onValueChange={onChange}>
        <SegmentedControlItem value="a" testID="a">
          <SegmentedControlItemText>A</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="b" testID="b">
          <SegmentedControlItemText>B</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
    </BloomThemeProvider>,
  );
}

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual('../../__mocks__/react-native-reanimated'),
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
}));

describe('SegmentedControl', () => {
  it('announces radio segments as checked / unchecked', () => {
    const { getByTestId } = renderControl('radio', 'a');
    expect(getByTestId('a').props.role).toBe('radio');
    expect(getByTestId('a').props['aria-checked']).toBe(true);
    expect(getByTestId('b').props['aria-checked']).toBe(false);
  });

  it('announces tab segments as selected, never checked', () => {
    const { getByTestId } = renderControl('tabs', 'a');
    expect(getByTestId('a').props.role).toBe('tab');
    expect(getByTestId('a').props['aria-selected']).toBe(true);
    expect(getByTestId('b').props['aria-selected']).toBe(false);
    // `aria-checked` on a `tab` is invalid ARIA, so the wrong spelling must be
    // absent rather than merely additionally present.
    expect(getByTestId('a').props['aria-checked']).toBeUndefined();
  });

  it('reports the pressed segment value to the caller', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderControl('radio', 'a', onChange);
    fireEvent.press(getByTestId('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('is controlled — pressing does not move the state by itself', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderControl('radio', 'a', onChange);
    pressHost(getByTestId('b'));
    // The floor this negative assertion needs: the press LANDED. "The state did
    // not move" is also exactly what a press reaching nothing reports —
    // measured, deleting the segment's `onPress` left the two checks below
    // green on their own.
    expect(onChange).toHaveBeenCalledWith('b');
    expect(getByTestId('a').props['aria-checked']).toBe(true);
    expect(getByTestId('b').props['aria-checked']).toBe(false);
  });

  it('renders each segment label', () => {
    const { getByText } = renderControl('radio', 'a');
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });

  it('refuses to render a segment outside a control rather than mis-announcing one', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <BloomThemeProvider mode="light" colorPreset="oxy">
          <SegmentedControlItem value="a">
            <SegmentedControlItemText>A</SegmentedControlItemText>
          </SegmentedControlItem>
        </BloomThemeProvider>,
      ),
    ).toThrow(/must be used within a SegmentedControl/);
    spy.mockRestore();
  });
});

describe('SegmentedControl dragging', () => {
  function setup(disabled = false) {
    const onChange = jest.fn();
    const ui = render(<BloomThemeProvider mode="light" colorPreset="oxy">
      <SegmentedControl label="Drag" type="radio" value="a" onValueChange={onChange}>
        {['a', 'b', 'c'].map(value => <SegmentedControlItem key={value} value={value} testID={value} disabled={disabled && value === 'b'}><SegmentedControlItemText>{value}</SegmentedControlItemText></SegmentedControlItem>)}
      </SegmentedControl>
    </BloomThemeProvider>);
    for (const [index] of ['a', 'b', 'c'].entries()) {
      const item = ui.UNSAFE_getAllByType(SegmentedControlItem)[index]!;
      const wrapper = item.find(node => typeof node.props.onLayout === 'function');
      fireEvent(wrapper, 'layout', { nativeEvent: { layout: { x: 4 + index * 102, width: 100, height: 28, y: 4 } } });
    }
    const handlers = ui.UNSAFE_getByType(GestureDetector).props.gesture.__handlers;
    return { ...ui, handlers, onChange };
  }
  it('measures without changing value and commits only on release', () => {
    const { handlers, onChange, getByTestId } = setup();
    expect(onChange).not.toHaveBeenCalled();
    act(() => { handlers.onBegin({ x: 54 }); handlers.onStart({}); handlers.onUpdate({ x: 258 }); });
    expect(onChange).not.toHaveBeenCalled();
    expect(getByTestId('a').props['aria-checked']).toBe(true);
    act(() => { handlers.onEnd({}, true); handlers.onFinalize({}); });
    expect(onChange.mock.calls).toEqual([['c']]);
    fireEvent.press(getByTestId('c'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getByTestId('a').props['aria-checked']).toBe(true);
  });
  it('ignores disabled origins and cancellation', () => {
    const { handlers, onChange } = setup(true);
    act(() => { handlers.onBegin({ x: 156 }); handlers.onStart({}); handlers.onUpdate({ x: 258 }); handlers.onEnd({}, true); handlers.onFinalize({}); });
    expect(onChange).not.toHaveBeenCalled();
    act(() => { handlers.onBegin({ x: 54 }); handlers.onStart({}); handlers.onUpdate({ x: 258 }); handlers.onFinalize({}); });
    expect(onChange).not.toHaveBeenCalled();
  });
  it('skips disabled destinations and ignores releasing on the current value', () => {
    const { handlers, onChange } = setup(true);
    act(() => { handlers.onBegin({ x: 54 }); handlers.onStart({}); handlers.onUpdate({ x: 160 }); handlers.onEnd({}, true); });
    expect(onChange).toHaveBeenLastCalledWith('c');
    act(() => { handlers.onBegin({ x: 258 }); handlers.onStart({}); handlers.onUpdate({ x: -100 }); handlers.onEnd({}, true); });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
