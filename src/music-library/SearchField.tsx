import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextStyle } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiCompass3Line } from '../icons/remix/RiCompass3Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography/scale';
import { GlyphButton } from './GlyphButton';
import { IS_WEB, MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID, resolveMusicLibraryPaint } from './shared';
import type { SearchFieldProps } from './types';

/**
 * The top-bar search pill.
 *
 *   48 tall, full pill · 12 · search glyph 24 · 8 · input body-medium ·
 *   clear (×, 32 round) once there is text · 1×24 divider · browse (40 round)
 *
 *   rest     the background 6% toward the text colour (dark 9%), transparent 1px border
 *   hover    10% (dark 14%)
 *   focus    the border takes the text colour — no size change
 *
 * Pressing anywhere on the pill focuses the input. The browse button is a
 * toggle: filled while `browseActive`, with `aria-pressed` on web and
 * `accessibilityState.selected` on native.
 */

export const SEARCH_FIELD_HEIGHT = 48;
const INPUT_TYPE = TYPE_SCALE['body-medium'];

const inputStyle: TextStyle = {
  flex: 1,
  minWidth: 0,
  fontFamily: SANS_FONT_FAMILY,
  fontSize: INPUT_TYPE.fontSize,
  lineHeight: INPUT_TYPE.lineHeight,
  fontWeight: INPUT_TYPE.fontWeight,
  height: SEARCH_FIELD_HEIGHT - 2,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
};

function SearchFieldComponent({
  value,
  onChangeText,
  onClear,
  onSubmit,
  onFocus,
  onBlur,
  onBrowsePress,
  browseActive = false,
  placeholder = 'What do you want to play?',
  accessibilityLabel = 'Search',
  clearLabel = 'Clear search',
  browseLabel = 'Browse',
  autoFocus,
  style,
  testID,
}: SearchFieldProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const inputRef = useRef<TextInput>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasText = value.length > 0;

  const pillStyle: WebCssStyle = {
    height: SEARCH_FIELD_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: focused ? paint.fieldFocusBorder : 'transparent',
    backgroundColor: hovered && !focused ? paint.fieldHover : paint.field,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    gap: 8,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  };

  return (
    <Pressable
      // A press on the pill's padding lands in the input. Not a control of its
      // own: the input is the focusable element.
      accessible={false}
      {...webDataSet({ bloomSearchField: '' })}
      {...(IS_WEB ? { tabIndex: -1 } : null)}
      onPress={() => inputRef.current?.focus()}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[pillStyle, style]}
      testID={testID}
    >
      <RiSearchLine width={24} height={24} fill={focused ? paint.text : paint.textMuted} />
      <TextInput
        ref={inputRef}
        {...webDataSet({ bloomMusicInput: '' })}
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
        <GlyphButton
          label={clearLabel}
          size={32}
          fill="transparent"
          hoverFill={paint.hover}
          ring={paint.ring}
          onPress={() => {
            onClear?.();
            inputRef.current?.focus();
          }}
          testID={testID ? `${testID}-clear` : undefined}
        >
          <RiCloseLine width={20} height={20} fill={paint.textMuted} />
        </GlyphButton>
      ) : null}
      {onBrowsePress ? (
        <>
          <View style={{ width: 1, height: 24, backgroundColor: paint.divider }} />
          <GlyphButton
            label={browseLabel}
            size={40}
            fill={browseActive ? paint.selected : 'transparent'}
            hoverFill={browseActive ? paint.selected : paint.fieldHover}
            pressedState={browseActive}
            ring={paint.ring}
            onPress={onBrowsePress}
            testID={testID ? `${testID}-browse` : undefined}
          >
            <RiCompass3Line width={22} height={22} fill={browseActive ? paint.text : paint.textMuted} />
          </GlyphButton>
        </>
      ) : null}
    </Pressable>
  );
}

export const SearchField = memo(SearchFieldComponent);
SearchField.displayName = 'SearchField';
