import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextStyle } from 'react-native';

import { webDataSet } from '../styles/web-data';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography/scale';
import { ChatGlyphButton } from './parts';
import {
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  IS_WEB,
  resolveChatListPaint,
} from './shared';
import type { ChatSearchFieldProps } from './types';

/**
 * The search pill above the conversations.
 *
 *   40 tall, full pill · 10 · search glyph 20 · 8 · input body-medium ·
 *   clear (×, 28 round) once there is text · any `trailing` slot
 *
 *   rest   the background 6% toward the text colour (dark 9%), transparent border
 *   hover  10% (dark 14%)
 *   focus  the border takes the text colour — no size change, so nothing reflows
 *
 * Pressing anywhere on the pill focuses the input; the pill itself is not a
 * control, the input is.
 *
 * WHY NOT `Search` OR the music library's field. `Search` is a `TextField` with a
 * floating LABEL — taller, and a label above a one-word search box is chrome a
 * chat header has no room for. The music field is the right geometry but it is
 * 48 tall with a Browse toggle and a divider baked in, and reusing it would make
 * a messaging screen import the music library's whole module graph for a pill.
 * The shape is small; the coupling would not be.
 */

export const CHAT_SEARCH_FIELD_HEIGHT = 40;
const INPUT_TYPE = TYPE_SCALE['body-medium'];

const inputStyle: TextStyle = {
  flex: 1,
  minWidth: 0,
  fontFamily: SANS_FONT_FAMILY,
  fontSize: INPUT_TYPE.fontSize,
  lineHeight: INPUT_TYPE.lineHeight,
  fontWeight: INPUT_TYPE.fontWeight,
  height: CHAT_SEARCH_FIELD_HEIGHT - 2,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
};

function ChatSearchFieldComponent({
  value,
  onChangeText,
  onClear,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Search',
  accessibilityLabel = 'Search chats',
  clearLabel = 'Clear search',
  trailing,
  autoFocus,
  style,
  testID,
}: ChatSearchFieldProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const inputRef = useRef<TextInput>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasText = value.length > 0;

  const pillStyle: WebCssStyle = {
    height: CHAT_SEARCH_FIELD_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: focused ? paint.text : 'transparent',
    backgroundColor: hovered && !focused ? paint.selected : paint.hover,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    gap: 8,
    ...(IS_WEB
      ? { transitionProperty: 'background-color, border-color', transitionDuration: '120ms' }
      : null),
  };

  return (
    <Pressable
      // A press on the pill's padding lands in the input. Not a control of its
      // own: the input is the focusable element.
      accessible={false}
      {...webDataSet({ bloomChatSearchPill: '' })}
      {...(IS_WEB ? { tabIndex: -1 } : null)}
      onPress={() => inputRef.current?.focus()}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[pillStyle, style]}
      testID={testID}
    >
      <RiSearchLine width={20} height={20} fill={focused ? paint.text : paint.textMuted} />
      <TextInput
        ref={inputRef}
        {...webDataSet({ bloomChatInput: '' })}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit ? () => onSubmit(value) : undefined}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        placeholderTextColor={paint.textMuted}
        accessibilityLabel={accessibilityLabel}
        role="searchbox"
        returnKeyType="search"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        autoFocus={autoFocus}
        keyboardAppearance={theme.isDark ? 'dark' : 'light'}
        style={[inputStyle, { color: paint.text }]}
        testID={testID ? `${testID}-input` : undefined}
      />
      {hasText ? (
        <ChatGlyphButton
          label={clearLabel}
          icon={RiCloseLine}
          size={28}
          glyph={18}
          color={paint.textMuted}
          hoverFill={paint.selected}
          ring={paint.ring}
          onPress={() => {
            onClear?.();
            inputRef.current?.focus();
          }}
          testID={testID ? `${testID}-clear` : undefined}
        />
      ) : null}
      {trailing !== undefined ? <View>{trailing}</View> : null}
    </Pressable>
  );
}

export const ChatSearchField = memo(ChatSearchFieldComponent);
ChatSearchField.displayName = 'ChatSearchField';
