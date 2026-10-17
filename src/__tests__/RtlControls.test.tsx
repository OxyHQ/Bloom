import React from 'react';
import { Animated, TextInput } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { DirectionContext } from '../direction/context';
import { isDirectionalIcon } from '../button/directional-icon';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiPlayLine } from '../icons/remix/RiPlayLine';
import { inlineScrollOffset, scrollOffsetForItem } from '../carousel/scroll-direction';
import { moveFocusedDate, weekStartForLocale } from '../date-picker/calendar-grid';
import { Switch } from '../switch';
import { TextFieldInput } from '../text-field';
import { resolvedStyle } from './support/rendered-style';

function rtl(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light" colorPreset="oxy">
    <DirectionContext.Provider value={{ locale: 'ar', direction: 'rtl' }}>{ui}</DirectionContext.Provider>
  </BloomThemeProvider>);
}

it('mirrors navigation arrows while preserving media glyphs', () => {
  expect(isDirectionalIcon(RiArrowLeftLine, 'rtl')).toBe(true);
  expect(isDirectionalIcon(RiArrowLeftLine, 'ltr')).toBe(false);
  expect(isDirectionalIcon(RiPlayLine, 'rtl')).toBe(false);
});

it('aligns unequal RTL cards at their right edges or centers without offsetLeft', () => {
  const track = { left: 100, right: 400, width: 300 }, item = { left: -10, right: 150, width: 160 };
  expect(inlineScrollOffset(-80, 'rtl')).toBe(80);
  expect(inlineScrollOffset(80, 'ltr')).toBe(80);
  expect(scrollOffsetForItem(track, item, -80, 'rtl')).toBe(-330);
  expect(scrollOffsetForItem(track, item, -80, 'rtl', 'center')).toBe(-260);
});

it('reverses calendar horizontal keys and derives locale week boundaries', () => {
  const day = new Date(2026, 8, 16);
  expect(moveFocusedDate(day, 'ArrowLeft', 0, 'rtl')?.getDate()).toBe(17);
  expect(moveFocusedDate(day, 'ArrowRight', 0, 'rtl')?.getDate()).toBe(15);
  expect(moveFocusedDate(day, 'ArrowDown', 0, 'rtl')?.getDate()).toBe(23);
  expect(weekStartForLocale('en-US')).toBe(0);
  expect(weekStartForLocale('en-GB')).toBe(1);
  expect(weekStartForLocale('invalid!')).toBe(0);
});

it('moves the switch thumb toward inline end in RTL', () => {
  const interpolate = jest.spyOn(Animated.Value.prototype, 'interpolate');
  rtl(<Switch value={false} onValueChange={() => {}} accessibilityLabel="Notifications" />);
  expect(interpolate).toHaveBeenCalledWith({ inputRange: [0, 1], outputRange: [-2, -20] });
  interpolate.mockRestore();
});

it('keeps email values LTR while aligning the field to its RTL form', () => {
  const { UNSAFE_getByType } = rtl(<TextFieldInput label="Email" keyboardType="email-address" value="a@example.test" />);
  const style = resolvedStyle(UNSAFE_getByType(TextInput).props.style);
  expect(style).toMatchObject({ writingDirection: 'ltr', textAlign: 'right', paddingRight: 4, paddingLeft: 0 });
});
