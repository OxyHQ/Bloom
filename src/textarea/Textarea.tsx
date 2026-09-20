import { normalizeBloomSize } from '../appearance/legacy';
import { useBloomAppearance } from '../appearance';
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
import { useInheritedControl } from '../control-surface';
import { useFieldMembership } from '../field/membership';
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
  onValueChange: onValueChangeProp,
  onChangeText,
  onFocus,
  onBlur,
  size: sizeProp,
  rows = 3,
  autoResize = false,
  maxRows,
  resize = 'vertical',
  maxLength,
  showCount = false,
  invalid: invalidProp,
  isInvalid,
  disabled = false,
  required = false,
  tooltip = false,
  style,
  inputStyle,
  inputRef,
  accessibilityLabel,
  nativeID,
  testID,
  ...rest
}: TextareaProps) {
  const invalid = invalidProp ?? isInvalid ?? false;
  const onValueChange = onValueChangeProp ?? onChangeText;
  const theme = useTheme();
  // The two contracts a textarea sits inside: a container's density
  // (`ControlSurface`) and an enclosing `Field`'s association. The label is
  // STACKED here, as it is on `TextField`, so the field's label wins — they are
  // two spellings of one thing and rendering both is the mistake `docs/field.mdx`
  // names.
  const { size: scopedSize } = useBloomAppearance({ size: normalizeBloomSize(sizeProp) }, { size: 'md', tone: 'neutral' });
  const size = useInheritedControl('density', normalizeBloomSize(sizeProp), scopedSize);
  const field = useFieldMembership({
    accessibilityLabel,
    label: label ?? placeholder,
    disabled,
    invalid: invalid,
    required,
    nativeID,
    // An `aria-describedby` the caller spread through `rest` is KEPT and the
    // field's is added to it, the same way `TextFieldInput` treats it: the two
    // are an id list, not a choice.
    describedBy: (rest as Record<string, unknown>)['aria-describedby'] as string | undefined,
  });
  const palette = useTextFieldPalette();
  const innerRef = useRef<TextInput>(null);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocusIn, onOut: onFocusOut } = useInteractionState();

  // The counter needs the value. Controlled fields read the prop; uncontrolled
  // ones keep only the length, so a keystroke re-renders the counter and
  // nothing else.
  const [typedLength, setTypedLength] = useState(() => (defaultValue ?? '').length);
  const count = value !== undefined ? value.length : typedLength;

  const state = { hovered, focused, invalid: field.invalid, disabled: field.disabled };
  const paint = resolveShellPaint(palette, state);
  const line = TEXT_FIELD_TEXT.lineHeight;

  const controlStyle = StyleSheet.flatten([
    {
      fontFamily: SANS_FONT_FAMILY,
      fontSize: TEXT_FIELD_TEXT.fontSize,
      lineHeight: line,
      fontWeight: TEXT_FIELD_TEXT.fontWeight,
      color: field.disabled ? palette.textDisabled : palette.text,
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
          cursor: field.disabled ? 'not-allowed' : undefined,
        } as unknown as TextStyle)
      : undefined,
    inputStyle,
  ]) as TextStyle;

  return (
    <View style={[{ width: '100%' }, style]} testID={testID}>
      {label ? (
        <TextFieldLabel required={field.required} tooltip={tooltip}>
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
              onClick: () => {
                if (!field.disabled) innerRef.current?.focus();
              },
              onMouseEnter: onHoverIn,
              onMouseLeave: onHoverOut,
            } as Record<string, unknown>)
          : {})}>
        <TextInput
          {...rest}
          {...(IS_WEB && field.disabled ? ({ disabled: true } as Record<string, unknown>) : {})}
          ref={mergeRefs([innerRef, inputRef])}
          multiline
          numberOfLines={rows}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          editable={field.disabled ? false : rest.editable}
          nativeID={field.nativeID}
          accessibilityLabel={field.accessibilityLabel}
          aria-describedby={field.describedBy}
          aria-invalid={field.invalid || undefined}
          aria-disabled={field.disabled || undefined}
          placeholder={placeholder}
          placeholderTextColor={resolvePlaceholderColor(palette, state)}
          keyboardAppearance={theme.isDark ? 'dark' : 'light'}
          onChangeText={(next) => {
            if (showCount && value === undefined) setTypedLength(next.length);
            onValueChange?.(next);
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
            <TextFieldHint invalid={field.invalid} style={{ marginTop: 0 }}>
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
                color: field.invalid ? palette.error : palette.count,
              }}>
              {maxLength ? `${count}/${maxLength}` : String(count)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
