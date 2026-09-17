import React, { useEffect, useState } from 'react';
import { Platform, TextInput, type TextStyle } from 'react-native';

import { MENU_FONT_FAMILY } from '../floating/menu-type';
import type { WebCssStyle } from '../styles/web-view-style';
import { TYPE_SCALE } from '../typography';

import { formatChipDate, parseChipDate } from './calendar-grid';
import type { CalendarPalette } from './palette';

/**
 * An editable `DD/MM/YYYY` chip: 104 wide, 38 tall (8px inset around a
 * 14/20 line, 1px border), radius 10, shadow-xs, border darkening on focus.
 *
 * Keeps its own draft while typing so the text is not reformatted on every
 * keystroke; commits on blur or submit, and reverts to the last valid day when
 * the draft does not parse.
 */
/** `transition-colors duration-100 ease-out` on the border. Web only. */
const CHIP_TRANSITION: WebCssStyle | null = Platform.OS === 'web'
  ? { transitionProperty: 'border-color', transitionDuration: '100ms', transitionTimingFunction: 'ease-out' }
  : null;

export function DateChipInput({
  date,
  label,
  onCommit,
  palette,
  testID,
}: {
  date: Date;
  label: string;
  onCommit: (date: Date) => void;
  palette: CalendarPalette;
  testID?: string;
}) {
  const formatted = formatChipDate(date);
  const [text, setText] = useState(formatted);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setText(formatted);
  }, [formatted]);

  const commit = () => {
    const parsed = parseChipDate(text);
    if (parsed) onCommit(parsed);
    else setText(formatted);
  };

  const style: TextStyle = {
    width: 104,
    height: 38,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: focused ? palette.chipBorderFocused : palette.chipBorder,
    backgroundColor: palette.panel,
    boxShadow: palette.shadowXs,
    color: palette.text,
    // `text-body-medium` in Inter — a `TextInput` does not inherit the face.
    ...TYPE_SCALE['body-medium'],
    ...MENU_FONT_FAMILY,
    // `outline-none`: the border change is the focus indicator.
    outlineWidth: 0,
  };

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onSubmitEditing={commit}
      onKeyPress={(event) => {
        if (event.nativeEvent.key === 'Escape') setText(formatted);
      }}
      inputMode="numeric"
      accessibilityLabel={label}
      style={[CHIP_TRANSITION, style]}
      testID={testID}
    />
  );
}
