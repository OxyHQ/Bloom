/**
 * The quick reaction bar: six glyphs and a "+" that hands over to the full
 * `EmojiPicker`. It is its own part rather than a mode of the picker because it
 * is shown in a different place (over a message, above its menu) and must stay
 * one row tall at 390px.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { RiAddLine } from '../icons/remix/RiAddLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { REACTION_PICKER_EMOJIS, resolveChatComposerPalette } from './shared';
import type { ReactionPickerProps } from './types';
import { dataHook, useChatComposerWebCss } from './web-hooks';

const BOX = { small: 30, medium: 36 } as const;
const GLYPH = { small: 'title-3-regular', medium: 'title-2-regular' } as const;

export function ReactionPicker({
  emojis = REACTION_PICKER_EMOJIS,
  selected,
  onSelectEmoji,
  onMorePress,
  moreLabel = 'More reactions',
  size = 'medium',
  surface = true,
  style,
  testID,
  accessibilityLabel = 'Quick reactions',
  emojiLabel,
}: ReactionPickerProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  useChatComposerWebCss();
  const [hovered, setHovered] = useState<string | null>(null);
  const box = BOX[size];

  const bar: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
    ...(surface
      ? {
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
          boxShadow: palette.shadowPanel,
        }
      : null),
    '--bloom-chat-composer-ring': palette.focusRing,
  };

  const cell = (key: string, active: boolean): WebCssStyle => ({
    width: box,
    height: box,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: active
      ? palette.accentSoft
      : hovered === key
        ? palette.hover
        : 'transparent',
    cursor: 'pointer',
  });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[bar, style]}
      testID={testID}>
      {emojis.map((emoji) => {
        const active = selected === emoji;
        return (
          <Pressable
            key={emoji}
            {...dataHook('bloomChatComposerControl')}
            accessibilityRole="button"
            accessibilityLabel={emojiLabel ? emojiLabel(emoji) : emoji}
            aria-pressed={active}
            accessibilityState={{ selected: active }}
            onPress={() => onSelectEmoji?.(emoji)}
            onHoverIn={() => setHovered(emoji)}
            onHoverOut={() => setHovered(null)}
            style={cell(emoji, active)}
            testID={testID ? `${testID}-${emoji}` : undefined}>
            <Text variant={GLYPH[size]}>{emoji}</Text>
          </Pressable>
        );
      })}
      {onMorePress ? (
        <Pressable
          {...dataHook('bloomChatComposerControl')}
          accessibilityRole="button"
          accessibilityLabel={moreLabel}
          onPress={onMorePress}
          onHoverIn={() => setHovered('__more')}
          onHoverOut={() => setHovered(null)}
          style={[cell('__more', false), { backgroundColor: hovered === '__more' ? palette.hover : palette.inset }]}
          testID={testID ? `${testID}-more` : undefined}>
          <RiAddLine width={18} height={18} fill={palette.iconSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
