import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextStyle,
} from 'react-native';

import { Chip } from '../chip';
import { useInheritedControl } from '../control-surface';
import { useFieldMembership } from '../field/membership';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useInteractionState } from '../hooks/use-interaction-state';
import { surfaceFillOn, useSurfaceFill } from '../styles/surface-levels';
import {
  resolvePlaceholderColor,
  resolveShellPaint,
  SANS_FONT_FAMILY,
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_RING_WIDTH,
  TEXT_FIELD_TEXT,
  useTextFieldPalette,
} from '../text-field/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { commitTag, filterSuggestions, normalizeTag } from './shared';
import type { TagFieldLabels, TagFieldProps } from './types';

/**
 * Tags as an input: the committed ones as removable chips, a caret after them,
 * and the vocabulary offered underneath.
 *
 *   shell       the `text-field` shell — same fill, same 10px radius, same 2px
 *               inset ring, so a tag field in a form row is the same object as
 *               the text fields above it
 *   min height  36 (`medium`) / 32 (`small`), and it GROWS: the chips wrap
 *   input       flexes to the end of the last line, 120 minimum, so a press in
 *               the empty part of that line lands on the caret itself
 *
 * **It is a `Field` member.** `useFieldMembership()` resolves the four things a
 * form asks of a control, each with a direction that is silently wrong the other
 * way round: the NAME defers to the field, `disabled` and `invalid` COMBINE with
 * it, the id is the caller's then the field's, and `aria-describedby` is joined
 * rather than replaced (`docs/composition.mdx` §Field).
 *
 * **A duplicate is rejected in silence** (`shared.ts`): the tag is already
 * there, so the field is already in the state the typist asked for. Being FULL
 * is the one refusal with a consequence, so it is the one reported back
 * (`onMaxReached`) and the one the hint names.
 *
 * **A comma commits, wherever it comes from.** It is handled in the text change
 * rather than in a key event, so it works on both platforms and a pasted
 * `"a, b, c"` becomes three tags instead of one string with commas in it.
 *
 * Nothing here knows what a tag is FOR. A CRM's accounts, a task app's labels
 * and a notes app's tags are the same control, and the day it learns about any
 * one of them it stops being usable by the other two.
 */

const IS_WEB = Platform.OS === 'web';

/** A DOM keyboard event as react-native-web hands it to `onKeyPress`. */
type WebKeyEvent = TextInputKeyPressEventData & { isComposing?: boolean };

/**
 * React Native's `Role` union has no `listbox`; react-native-web passes the DOM
 * `role` straight through, so it travels as a web-only prop and native takes
 * the nearest thing it has.
 */
const LIST_ROLE: Record<string, unknown> = IS_WEB
  ? { role: 'listbox' }
  : { accessibilityRole: 'list' };

const DEFAULT_LABELS: Required<TagFieldLabels> = {
  remove: (tag) => `Remove ${tag}`,
  full: (max) => `${max} maximum`,
  suggestions: 'Suggestions',
};

export function TagField({
  value,
  onChange,
  inputValue,
  onInputValueChange,
  placeholder,
  suggestions,
  maxSuggestions = 6,
  allowCreate = true,
  max,
  onMaxReached,
  normalize = normalizeTag,
  tone = 'default',
  size: sizeProp,
  disabled = false,
  invalid = false,
  label,
  accessibilityLabel,
  nativeID,
  labels: labelsProp,
  style,
  testID,
}: TagFieldProps) {
  const theme = useTheme();
  // The size vocabulary IS the density pair, so a `ControlSurface density="small"`
  // around a filter row reaches this field exactly as it reaches the text fields
  // beside it — `docs/composition.mdx` §Control presentation.
  const size = useInheritedControl('density', sizeProp, 'medium');
  const palette = useTextFieldPalette();
  const surface = useSurfaceFill();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const inputRef = useRef<TextInput | null>(null);
  const reactId = useId();
  const listId = `${nativeID ?? reactId}-suggestions`;

  // The label is STACKED (the field's label sits above the box, and it is the
  // same thing this control's own `label` says), so the field's wins.
  const field = useFieldMembership({ accessibilityLabel, label, disabled, invalid, nativeID });

  const [ownText, setOwnText] = useState('');
  const text = inputValue ?? ownText;
  const setText = useCallback(
    (next: string) => {
      if (inputValue === undefined) setOwnText(next);
      onInputValueChange?.(next);
    },
    [inputValue, onInputValueChange],
  );

  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const full = max !== undefined && value.length >= max;
  const known = useMemo(
    () => (suggestions ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.value)),
    [suggestions],
  );
  const offered = useMemo(
    () =>
      suggestions === undefined || full || field.disabled
        ? []
        : filterSuggestions(suggestions, text, value, maxSuggestions),
    [suggestions, text, value, maxSuggestions, full, field.disabled],
  );
  const listOpen = focused && offered.length > 0;

  const add = useCallback(
    (raw: string) => {
      const result = commitTag(value, raw, { normalize, max, allowCreate, known });
      if (result.rejected === 'full') onMaxReached?.();
      if (result.next) onChange(result.next);
      return result.next !== null;
    },
    [value, normalize, max, allowCreate, known, onMaxReached, onChange],
  );

  const remove = useCallback(
    (tag: string) => onChange(value.filter((entry) => entry !== tag)),
    [onChange, value],
  );

  // A comma commits — in the CHANGE, not in a key event, so it works on both
  // platforms and a pasted "a, b, c" becomes three tags.
  const handleChangeText = useCallback(
    (next: string) => {
      if (!next.includes(',')) {
        setText(next);
        setActiveIndex(-1);
        return;
      }
      const parts = next.split(',');
      const tail = parts.pop() ?? '';
      let list = value;
      for (const part of parts) {
        const result = commitTag(list, part, { normalize, max, allowCreate, known });
        if (result.rejected === 'full') onMaxReached?.();
        if (result.next) list = result.next;
      }
      if (list !== value) onChange(list);
      setText(tail);
      setActiveIndex(-1);
    },
    [setText, value, normalize, max, allowCreate, known, onMaxReached, onChange],
  );

  const submit = useCallback(() => {
    const chosen = activeIndex >= 0 ? offered[activeIndex] : undefined;
    if (chosen) {
      if (add(chosen.value)) setText('');
      setActiveIndex(-1);
      return;
    }
    if (add(text)) setText('');
    setActiveIndex(-1);
  }, [activeIndex, offered, add, text, setText]);

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const native = event.nativeEvent as WebKeyEvent;
      // An IME candidate window owns Enter and the arrows while it is open.
      if (native.isComposing === true) return;
      if (native.key === 'Backspace' && text === '' && value.length > 0) {
        const last = value[value.length - 1];
        if (last !== undefined) remove(last);
        return;
      }
      if (!IS_WEB) return;
      if (offered.length > 0 && (native.key === 'ArrowDown' || native.key === 'ArrowUp')) {
        event.preventDefault();
        const step = native.key === 'ArrowDown' ? 1 : -1;
        const from = activeIndex < 0 ? (step > 0 ? -1 : 0) : activeIndex;
        setActiveIndex((from + step + offered.length) % offered.length);
        return;
      }
      if (native.key === 'Escape') {
        event.preventDefault();
        setActiveIndex(-1);
        return;
      }
      if (native.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    },
    [text, value, remove, offered, activeIndex, submit],
  );

  const geometry = TEXT_FIELD_GEOMETRY[size];
  const shell = resolveShellPaint(palette, {
    hovered,
    focused,
    invalid: field.invalid,
    disabled: field.disabled,
  });
  const placeholderColor = resolvePlaceholderColor(palette, {
    hovered,
    focused,
    invalid: field.invalid,
    disabled: field.disabled,
  });

  // The highlighted row is one surface step off the list's own fill — the same
  // move every raised surface in Bloom makes, rather than a ramp stop that is
  // only right on one page colour.
  const optionActive = surfaceFillOn(theme, palette.background);

  const hint = full && max !== undefined ? labels.full(max) : undefined;
  const hintId = hint ? `${nativeID ?? reactId}-hint` : undefined;
  const describedBy = [field.describedBy, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <View style={style} testID={testID}>
      <View
        onPointerEnter={IS_WEB ? onHoverIn : undefined}
        onPointerLeave={IS_WEB ? onHoverOut : undefined}
        style={{
          minHeight: geometry.height,
          paddingVertical: 4,
          paddingHorizontal: geometry.paddingHorizontal,
          borderRadius: TEXT_FIELD_RADIUS,
          borderWidth: TEXT_FIELD_RING_WIDTH,
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          backgroundColor: shell.backgroundColor,
          borderColor: shell.borderColor,
        }}
        testID={testID ? `${testID}-shell` : undefined}
      >
        {value.map((tag) => (
          <Chip
            key={tag}
            size="medium"
            variant="subtle"
            color={tone}
            surface={shell.backgroundColor}
            endIcon={
              field.disabled ? undefined : (
                <Pressable
                  onPress={() => remove(tag)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  // `Chip`'s own `onClose` names its × "Remove" with no
                  // subject, so the × is passed as an end icon that names
                  // itself. The 14px glyph reaches a 38pt target through
                  // `hitSlop`, which a bounding box does not show.
                  accessibilityLabel={labels.remove(tag)}
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  testID={testID ? `${testID}-remove-${tag}` : undefined}
                >
                  <RiCloseLine width={14} height={14} fill={theme.colors.textSecondary} />
                </Pressable>
              )
            }
          >
            {tag}
          </Chip>
        ))}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={handleChangeText}
          onSubmitEditing={submit}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setActiveIndex(-1);
          }}
          editable={!field.disabled && !full}
          placeholder={value.length === 0 || focused ? placeholder : undefined}
          placeholderTextColor={placeholderColor}
          blurOnSubmit={false}
          autoCorrect={false}
          nativeID={field.nativeID}
          accessibilityLabel={field.accessibilityLabel}
          aria-describedby={describedBy}
          aria-invalid={field.invalid || undefined}
          aria-disabled={field.disabled || undefined}
          accessibilityState={{ disabled: field.disabled }}
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-activedescendant={listOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          style={[
            {
              flex: 1,
              minWidth: 120,
              height: geometry.height - 8,
              color: field.disabled ? palette.textDisabled : palette.text,
              fontFamily: SANS_FONT_FAMILY,
              fontSize: TEXT_FIELD_TEXT.fontSize,
              lineHeight: TEXT_FIELD_TEXT.lineHeight,
              padding: 0,
            },
            // The SHELL carries the focus ring, exactly as `TextField`'s does.
            // Left alone, the browser draws its own outline around the caret
            // INSIDE the shell and the control has two focus indicators.
            IS_WEB
              ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle)
              : undefined,
          ]}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>

      {hint ? (
        <Text
          nativeID={hintId}
          variant="caption-1-medium"
          style={{ color: palette.hint, marginTop: 4 }}
          testID={testID ? `${testID}-hint` : undefined}
        >
          {hint}
        </Text>
      ) : null}

      {listOpen ? (
        <View
          nativeID={listId}
          {...LIST_ROLE}
          accessibilityLabel={labels.suggestions}
          style={{
            marginTop: 6,
            borderRadius: TEXT_FIELD_RADIUS,
            borderWidth: 1,
            borderColor: palette.ringHover,
            backgroundColor: palette.background,
            overflow: 'hidden',
          }}
          testID={testID ? `${testID}-suggestions` : undefined}
        >
          {offered.map((suggestion, index) => (
            <Pressable
              key={suggestion.value}
              nativeID={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              accessibilityState={{ selected: index === activeIndex }}
              accessibilityLabel={suggestion.label ?? suggestion.value}
              onPress={() => {
                if (add(suggestion.value)) setText('');
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              onHoverIn={() => setActiveIndex(index)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                minHeight: 36,
                paddingHorizontal: 10,
                backgroundColor: index === activeIndex ? optionActive : 'transparent',
              }}
              testID={testID ? `${testID}-suggestion-${suggestion.value}` : undefined}
            >
              <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.text, flexShrink: 1 }}>
                {suggestion.label ?? suggestion.value}
              </Text>
              {suggestion.meta !== undefined ? (
                <Text variant="caption-1-regular" style={{ color: palette.count }}>
                  {suggestion.meta}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
TagField.displayName = 'TagField';
