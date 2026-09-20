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
import { DEFAULT_SIDE_OFFSET } from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { useInteractionState } from '../hooks/use-interaction-state';
import { atoms as a, android, web } from '../styles';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  resolvePlaceholderColor,
  resolveShellPaint,
  SANS_FONT_FAMILY,
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_INPUT_INSET,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_RING_WIDTH,
  TEXT_FIELD_STACK_GAP,
  TEXT_FIELD_TEXT,
  TEXT_FIELD_WEB_TRANSITION,
  useTextFieldPalette,
} from '../text-field/shared';
import { Text } from '../typography';
import {
  TAG_CHIP_RUNG,
  TAG_FIELD_GAP,
  TAG_FIELD_INPUT_MIN_WIDTH,
  TAG_FIELD_LIST_GAP,
  TAG_FIELD_LIST_PADDING,
  TAG_FIELD_LIST_RADIUS,
  TAG_FIELD_OPTION_GAP,
  TAG_FIELD_OPTION_MIN_HEIGHT,
  TAG_FIELD_OPTION_PADDING,
  TAG_FIELD_OPTION_RADIUS,
  TAG_FIELD_SHELL_INSET,
} from './constants';
import { commitTag, filterSuggestions, normalizeTag } from './shared';
import type { TagFieldLabels, TagFieldProps } from './types';

/**
 * Tags as an input: the committed ones as removable chips, a caret after them,
 * and the vocabulary offered underneath.
 *
 * THE FIELD IS A `text-field` BOX, not something that resembles one. The fill,
 * the 10px radius, the 2px inset ring, the hover and focus rings, the invalid
 * tint and the disabled tint are all `text-field/shared.ts`'s, resolved through
 * `useTextFieldPalette()` for the surface this field actually lands on. The one
 * thing that is copied rather than reused is the chrome ELEMENT — `TextField`
 * paints its shell as an absolutely positioned overlay that is not exported as
 * a part, and it has to be an overlay rather than a border on the flex box: a
 * 2px border would take its width out of the content box and make an empty tag
 * field 40 tall beside a 36-tall text field in the same form.
 *
 *   shell       `TEXT_FIELD_GEOMETRY[size]` — 36 (`medium`) / 32 (`small`) when
 *               empty, to the pixel, and it GROWS as the chips wrap
 *   chips       `Chip` at the rung that fills the shell's inner height, `subtle`
 *               in the field's tone — the pill `mail-compose` puts a chosen
 *               recipient in, without the avatar
 *   input       flexes to the end of the last line, 120 minimum, and keeps its
 *               placeholder whenever it is empty, so the field reads as a field
 *               rather than as a box with pills in it
 *   list        the menu vocabulary (`floating/`): panel surface, hairline,
 *               dropdown shadow, 16px corner, 36-tall rows on a 10px corner
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

/**
 * `TextField`'s own input reset: react-native-web paints the browser's focus
 * outline on the `<input>` itself, which would sit INSIDE the shell's ring and
 * give the control two focus indicators.
 */
const WEB_INPUT_OUTLINE_RESET: TextStyle | undefined = IS_WEB
  ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle)
  : undefined;

/** `disabled:cursor-not-allowed`, as `TextField` spells it. */
const WEB_INPUT_DISABLED_CURSOR: TextStyle | undefined = IS_WEB
  ? ({ cursor: 'not-allowed' } as unknown as TextStyle)
  : undefined;

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
  // The size vocabulary IS the density pair, so a `ControlSurface density="small"`
  // around a filter row reaches this field exactly as it reaches the text fields
  // beside it — `docs/composition.mdx` §Control presentation.
  const size = useInheritedControl('density', sizeProp, 'medium');
  const palette = useTextFieldPalette();
  const menu = useMenuPalette();
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
  const state = {
    hovered,
    focused,
    invalid: field.invalid,
    disabled: field.disabled,
  };
  const shell = resolveShellPaint(palette, state);
  const placeholderColor = resolvePlaceholderColor(palette, state);

  const hint = full && max !== undefined ? labels.full(max) : undefined;
  const hintId = hint ? `${nativeID ?? reactId}-hint` : undefined;
  const describedBy = [field.describedBy, hintId].filter(Boolean).join(' ') || undefined;

  const listPanel: WebCssStyle = {
    marginTop: DEFAULT_SIDE_OFFSET,
    padding: TAG_FIELD_LIST_PADDING,
    gap: TAG_FIELD_LIST_GAP,
    borderRadius: TAG_FIELD_LIST_RADIUS,
    borderWidth: 1,
    borderColor: menu.border,
    backgroundColor: menu.surface,
    boxShadow: menu.shadow,
    overflow: 'hidden',
  };

  return (
    <View style={style} testID={testID}>
      <View
        style={{
          position: 'relative',
          minHeight: geometry.height,
          paddingVertical: TAG_FIELD_SHELL_INSET,
          paddingHorizontal: geometry.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: TAG_FIELD_GAP,
        }}
        // `TextField`'s own shell handlers: the whole box is the hit area for
        // the caret, and hover lights the ring.
        {...(IS_WEB
          ? ({
              onClick: () => inputRef.current?.focus(),
              onMouseOver: onHoverIn,
              onMouseOut: onHoverOut,
            } as Record<string, unknown>)
          : undefined)}
        testID={testID ? `${testID}-shell` : undefined}
      >
        {/*
          The shell's fill and ring, as `TextField`'s `Chrome` paints them: an
          overlay UNDER the content rather than a border on the flex box, so the
          2px ring costs the chips and the caret no room and an empty tag field
          is exactly the rung an empty text field is.
        */}
        <View
          pointerEvents="none"
          style={[
            a.z_10,
            a.absolute,
            a.inset_0,
            {
              borderRadius: TEXT_FIELD_RADIUS,
              borderWidth: TEXT_FIELD_RING_WIDTH,
              ...shell,
            },
            TEXT_FIELD_WEB_TRANSITION,
          ]}
        />
        {value.map((tag) => (
          <Chip
            key={tag}
            size={TAG_CHIP_RUNG[size]}
            variant="subtle"
            color={tone}
            surface={shell.backgroundColor}
            disabled={field.disabled}
            style={a.z_20}
            // `Chip` owns the close button — its glyph, its slot, its hit slop
            // and, since `closeLabel`, its NAME. A row of pills whose buttons
            // are all called "Remove" gives a screen reader no way to say which
            // one it is about; the tag is the subject.
            closeLabel={labels.remove(tag)}
            onClose={field.disabled ? undefined : () => remove(tag)}
            testID={testID ? `${testID}-chip-${tag}` : undefined}
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
          // Whenever the caret is empty, not only when the field is: a box of
          // chips with no visible caret and no prompt does not read as an input
          // at all, which is what made this control a container with pills in it.
          placeholder={text === '' ? placeholder : undefined}
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
            a.relative,
            a.z_20,
            {
              flex: 1,
              minWidth: TAG_FIELD_INPUT_MIN_WIDTH,
              // The caret's line IS a chip's line, so a chip and the text being
              // typed after it sit on one baseline.
              height: geometry.height - 2 * TAG_FIELD_SHELL_INSET,
              color: field.disabled ? palette.textDisabled : palette.text,
              fontFamily: SANS_FONT_FAMILY,
              fontSize: TEXT_FIELD_TEXT.fontSize,
              fontWeight: TEXT_FIELD_TEXT.fontWeight,
              // The same `pl-1` the text field's own control carries, so the
              // caret of an empty tag field starts where its neighbour's does.
              paddingLeft: TEXT_FIELD_INPUT_INSET,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: 0,
              textAlignVertical: 'center',
            },
            // A single-line iOS `TextInput` with a `lineHeight` sits its glyphs
            // low, so the 20px line box is web's alone.
            web({ lineHeight: TEXT_FIELD_TEXT.lineHeight }),
            android({ includeFontPadding: false }),
            WEB_INPUT_OUTLINE_RESET,
            field.disabled ? WEB_INPUT_DISABLED_CURSOR : undefined,
          ]}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>

      {hint ? (
        <Text
          nativeID={hintId}
          variant="caption-1-medium"
          style={{ paddingTop: 1, marginTop: TEXT_FIELD_STACK_GAP, color: palette.hint }}
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
          style={listPanel}
          testID={testID ? `${testID}-suggestions` : undefined}
        >
          {offered.map((suggestion, index) => {
            const active = index === activeIndex;
            const row: WebCssStyle = {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: TAG_FIELD_OPTION_GAP,
              minHeight: TAG_FIELD_OPTION_MIN_HEIGHT,
              padding: TAG_FIELD_OPTION_PADDING,
              borderRadius: TAG_FIELD_OPTION_RADIUS,
              backgroundColor: active ? menu.rowHighlight : 'transparent',
              cursor: 'pointer',
            };
            return (
              <Pressable
                key={suggestion.value}
                nativeID={`${listId}-${index}`}
                {...(IS_WEB
                  ? ({
                      // The combobox holds focus and points at the active row
                      // with `aria-activedescendant`; an option that is its own
                      // tab stop would take the caret away from the text being
                      // typed. `focusable={false}` does NOT do it —
                      // react-native-web's `Pressable` still emits
                      // `tabindex="0"` — so it is the web attribute, spelled
                      // the way `Chip`'s roving row spells it.
                      tabIndex: -1,
                      // AND the press must not move focus. A mousedown on the
                      // row blurs the caret, `focused` goes false, the list
                      // unmounts under the pointer and the click that would
                      // have chosen the suggestion lands on nothing: measured
                      // in Chrome, every suggestion was unclickable while the
                      // keyboard path worked perfectly. Preventing the
                      // mousedown's default keeps the caret; the click still
                      // fires.
                      onMouseDown: (event: { preventDefault: () => void }) =>
                        event.preventDefault(),
                    } as Record<string, unknown>)
                  : null)}
                role="option"
                aria-selected={active}
                accessibilityState={{ selected: active }}
                accessibilityLabel={suggestion.label ?? suggestion.value}
                onPress={() => {
                  if (add(suggestion.value)) setText('');
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                onHoverIn={() => setActiveIndex(index)}
                style={row}
                testID={testID ? `${testID}-suggestion-${suggestion.value}` : undefined}
              >
                <Text
                  variant="body-medium"
                  numberOfLines={1}
                  style={{ color: menu.text, flexShrink: 1 }}
                >
                  {suggestion.label ?? suggestion.value}
                </Text>
                {suggestion.meta !== undefined ? (
                  <Text variant="caption-1-medium" style={{ color: menu.textSecondary }}>
                    {suggestion.meta}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
TagField.displayName = 'TagField';
