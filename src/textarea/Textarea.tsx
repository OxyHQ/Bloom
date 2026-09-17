import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextStyle, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { mergeRefs } from '../hooks/merge-refs';
import { Text } from '../typography';
import { TextFieldHint, TextFieldLabel } from '../text-field';
import {
  SANS_FONT_FAMILY,
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_INPUT_INSET,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_RING_WIDTH,
  TEXT_FIELD_STACK_GAP,
  TEXT_FIELD_TEXT,
  TEXT_FIELD_WEB_TRANSITION,
  resolvePlaceholderColor,
  resolveShellPaint,
  useTextFieldPalette,
} from '../text-field/shared';
import type { TextareaProps } from './types';

const IS_WEB = Platform.OS === 'web';

/** The shell is `p-2` (8px) at `medium` and `px-1.5 py-2` at `small`. */
const SHELL_PADDING_VERTICAL = 8;

/**
 * `Textarea` — the multiline sibling of `TextField`, with the same
 * filled shell, the same inset ring and the same tokens (`text-field/shared`),
 * so a textarea stacked under an input lines up to the pixel.
 *
 *   shell   radius 10, p-2 (medium) / px-1.5 py-2 (small), inset 2px ring
 *   control px-1, text-body-regular 14/20, `rows` × 20 tall (3 by default)
 *   footer  hint left, counter right (caption 12/16 500, tabular numerals)
 *
 * The ring is a 2px border here rather than an overlay, so the shell's padding
 * is reduced by the same 2px and the content box stays in place.
 *
 * `autoResize` grows the control a line at a time up to `maxRows`. Native
 * multiline inputs already grow with their content between `minHeight` and
 * `maxHeight`; on web the same is `field-sizing: content`, which shrinks back
 * as well as growing (browsers without it keep the `rows` height and scroll).
 */
export function Textarea({
  label,
  hint,
  placeholder,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  size = 'medium',
  rows = 3,
  autoResize = false,
  maxRows,
  resize = 'vertical',
  maxLength,
  showCount = false,
  isInvalid = false,
  disabled = false,
  required = false,
  tooltip = false,
  style,
  inputStyle,
  inputRef,
  accessibilityLabel,
  testID,
  ...rest
}: TextareaProps) {
  const theme = useTheme();
  const palette = useTextFieldPalette();
  const innerRef = useRef<TextInput>(null);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocusIn, onOut: onFocusOut } = useInteractionState();

  // The counter needs the value. Controlled fields read the prop; uncontrolled
  // ones keep only the length, so a keystroke re-renders the counter and
  // nothing else.
  const [typedLength, setTypedLength] = useState(() => (defaultValue ?? '').length);
  const count = value !== undefined ? value.length : typedLength;

  const state = { hovered, focused, invalid: isInvalid, disabled };
  const paint = resolveShellPaint(palette, state);
  const line = TEXT_FIELD_TEXT.lineHeight;

  const controlStyle = StyleSheet.flatten([
    {
      fontFamily: SANS_FONT_FAMILY,
      fontSize: TEXT_FIELD_TEXT.fontSize,
      lineHeight: line,
      fontWeight: TEXT_FIELD_TEXT.fontWeight,
      color: disabled ? palette.textDisabled : palette.text,
      paddingLeft: TEXT_FIELD_INPUT_INSET,
      paddingRight: TEXT_FIELD_INPUT_INSET,
      paddingTop: 0,
      paddingBottom: 0,
      margin: 0,
      minWidth: 0,
      width: '100%',
      textAlignVertical: 'top',
    },
    autoResize
      ? {
          minHeight: rows * line,
          maxHeight: maxRows ? maxRows * line : undefined,
        }
      : { height: rows * line },
    IS_WEB
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          resize: autoResize ? 'none' : resize,
          fieldSizing: autoResize ? 'content' : undefined,
          cursor: disabled ? 'not-allowed' : undefined,
        } as unknown as TextStyle)
      : undefined,
    inputStyle,
  ]) as TextStyle;

  const name = label ?? accessibilityLabel ?? placeholder;

  return (
    <View style={[{ width: '100%' }, style]} testID={testID}>
      {label ? (
        <TextFieldLabel required={required} tooltip={tooltip}>
          {label}
        </TextFieldLabel>
      ) : null}

      <View
        style={[
          {
            borderRadius: TEXT_FIELD_RADIUS,
            borderWidth: TEXT_FIELD_RING_WIDTH,
            paddingHorizontal: TEXT_FIELD_GEOMETRY[size].paddingHorizontal - TEXT_FIELD_RING_WIDTH,
            paddingVertical: SHELL_PADDING_VERTICAL - TEXT_FIELD_RING_WIDTH,
            ...paint,
          },
          TEXT_FIELD_WEB_TRANSITION,
        ]}
        {...(IS_WEB
          ? ({
              onClick: () => innerRef.current?.focus(),
              onMouseEnter: onHoverIn,
              onMouseLeave: onHoverOut,
            } as Record<string, unknown>)
          : {})}>
        <TextInput
          {...rest}
          {...(IS_WEB && disabled ? ({ disabled: true } as Record<string, unknown>) : {})}
          ref={mergeRefs([innerRef, inputRef])}
          multiline
          numberOfLines={rows}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          editable={disabled ? false : rest.editable}
          accessibilityLabel={name}
          aria-invalid={isInvalid || undefined}
          aria-disabled={disabled || undefined}
          placeholder={placeholder}
          placeholderTextColor={resolvePlaceholderColor(palette, state)}
          keyboardAppearance={theme.isDark ? 'dark' : 'light'}
          onChangeText={(next) => {
            if (showCount && value === undefined) setTypedLength(next.length);
            onChangeText?.(next);
          }}
          onFocus={(e) => {
            onFocusIn();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            onFocusOut();
            onBlur?.(e);
          }}
          style={controlStyle}
        />
      </View>

      {hint || showCount ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: TEXT_FIELD_STACK_GAP,
          }}>
          {hint ? (
            <TextFieldHint isInvalid={isInvalid} style={{ marginTop: 0 }}>
              {hint}
            </TextFieldHint>
          ) : null}
          {showCount ? (
            <Text
              variant="caption-1-medium"
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                paddingTop: 1,
                fontVariant: ['tabular-nums'],
                color: isInvalid ? palette.error : palette.count,
              }}>
              {maxLength ? `${count}/${maxLength}` : String(count)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
