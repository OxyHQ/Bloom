import React, { memo, useEffect, useMemo, useState } from 'react';
import { Platform, TextInput, type TextStyle } from 'react-native';

import { MENU_FONT_FAMILY } from '../floating/menu-type';
import { DISABLED_OPACITY } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography';
import { resolveCalendarPalette } from './palette';
import { formatTime, parseTime, snapTime, stepTime } from './time';
import type { TimeFieldProps, TimeFieldSize } from './types';
import { useInheritedControl } from '../control-surface';
import { useFieldMembership } from '../field/membership';

/**
 * A time of day, typed. `DatePicker` is the day; this is the hour and minute,
 * and it is a FIELD rather than a fourth popover — a viewing at 18:30 is four
 * keystrokes, and a popover is the wrong instrument for four keystrokes.
 *
 *              width   height   text             step arrows
 *   small      96      32       body-2-medium    yes
 *   medium     104     38       body-medium      yes
 *
 * Geometry, palette and focus behaviour are `DateChipInput`'s — the
 * `DD/MM/YYYY` chip inside the pickers — so a date and a time typed beside each
 * other line up: 1px `chipBorder` darkening to `chipBorderFocused` on focus
 * (the border IS the focus indicator, `outline-none`), radius 10, shadow-xs,
 * the panel fill.
 *
 * It keeps its own DRAFT while typing, so the text is not reformatted under the
 * cursor, and commits on blur or submit; Escape reverts. A draft that does not
 * parse reverts too, rather than reporting an error the field has no room to
 * draw — `parseTime` is forgiving enough (`9`, `930`, `9.30`, `9pm`, `21:30`)
 * that the remaining failures really are not times.
 *
 * ArrowUp / ArrowDown move by `step` and commit immediately, clamped at `min`
 * and `max` rather than wrapping. They are a convenience on a text box, not a
 * `spinbutton`: the control is a text field, it announces itself as one, and
 * every value it can reach can also be typed. Its NAME is
 * `accessibilityLabel` — required, because `"--:--"` names nothing.
 *
 * The VALUE is always 24h `"HH:mm"`, whatever `hourFormat` draws, so it drops
 * straight into `MeetingScheduler`'s `timeSlots` and needs no locale from the
 * caller.
 */

const SIZE_CONFIG: Record<TimeFieldSize, { width: number; height: number; type: 'body-medium' | 'body-2-medium' }> = {
  small: { width: 96, height: 32, type: 'body-2-medium' },
  medium: { width: 104, height: 38, type: 'body-medium' },
};

/** `transition-colors duration-100 ease-out` on the border. Web only. */
const FIELD_TRANSITION: WebCssStyle | null =
  Platform.OS === 'web'
    ? { transitionProperty: 'border-color', transitionDuration: '100ms', transitionTimingFunction: 'ease-out' }
    : null;

function TimeFieldComponent({
  value,
  onChange,
  min,
  max,
  step = 1,
  hourFormat = '24h',
  size: sizeProp,
  disabled: disabledProp = false,
  accessibilityLabel,
  placeholder,
  width,
  style,
  testID,
}: TimeFieldProps) {
  const theme = useTheme();
  // `"--:--"` names nothing, so the name is a prop — or, inside a `Field`, the
  // field's label. The density contract supplies the size the same way: a
  // container can ask for `small` once instead of on every control.
  const density = useInheritedControl('density', sizeProp === 'small' ? 'sm' : sizeProp === 'medium' ? 'md' : undefined, 'md');
  const size = density === 'sm' ? 'small' : 'medium';
  const field = useFieldMembership({ accessibilityLabel, disabled: disabledProp });
  const disabled = field.disabled;
  const palette = useMemo(() => resolveCalendarPalette(theme), [theme]);
  const config = SIZE_CONFIG[size];

  const shown = value ? formatTime(value, hourFormat) : '';
  const [text, setText] = useState(shown);
  const [focused, setFocused] = useState(false);

  // The committed value is the source of truth; a change from outside (or a
  // format flip) rewrites the draft.
  useEffect(() => {
    setText(shown);
  }, [shown]);

  const commit = (draft: string) => {
    if (draft.trim() === '') {
      setText('');
      if (value !== null) onChange(null);
      return;
    }
    const parsed = parseTime(draft, hourFormat);
    const next = parsed ? snapTime(parsed, { step, min, max }) : null;
    if (!next) {
      setText(shown);
      return;
    }
    setText(formatTime(next, hourFormat));
    if (next !== value) onChange(next);
  };

  const nudge = (direction: 1 | -1) => {
    const next = stepTime(value, direction, { step, min, max });
    if (!next) return;
    setText(formatTime(next, hourFormat));
    if (next !== value) onChange(next);
  };

  const fieldStyle: TextStyle = {
    width: width ?? config.width,
    height: config.height,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: focused ? palette.chipBorderFocused : palette.chipBorder,
    backgroundColor: palette.panel,
    boxShadow: palette.shadowXs,
    color: disabled ? palette.disabledText : palette.text,
    opacity: disabled ? DISABLED_OPACITY : 1,
    // A `TextInput` inherits no face.
    ...TYPE_SCALE[config.type],
    ...MENU_FONT_FAMILY,
    // `outline-none`: the border change is the focus indicator.
    outlineWidth: 0,
  };

  return (
    <TextInput
      value={text}
      editable={!disabled}
      onChangeText={setText}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onSubmitEditing={() => commit(text)}
      onKeyPress={(event) => {
        const key = event.nativeEvent.key;
        if (key === 'Escape') {
          setText(shown);
        } else if (key === 'ArrowUp') {
          (event as unknown as { preventDefault?: () => void }).preventDefault?.();
          nudge(1);
        } else if (key === 'ArrowDown') {
          (event as unknown as { preventDefault?: () => void }).preventDefault?.();
          nudge(-1);
        }
      }}
      placeholder={placeholder ?? (hourFormat === '12h' ? '--:-- --' : '--:--')}
      placeholderTextColor={palette.secondaryText}
      inputMode={hourFormat === '12h' ? 'text' : 'numeric'}
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-disabled={disabled || undefined}
      style={[FIELD_TRANSITION, fieldStyle, style]}
      testID={testID}
    />
  );
}

export const TimeField = memo(TimeFieldComponent);
TimeField.displayName = 'TimeField';
