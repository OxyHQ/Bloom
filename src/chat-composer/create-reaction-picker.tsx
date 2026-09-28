import { useBloomAppearance } from '../appearance';
import { useSurfaceFill } from '../styles/surface-levels';
import { useCardFill } from '../card/use-card-fill';
import type { Surface as SurfaceComponent } from '../surface';
/**
 * The quick reaction bar: six glyphs and a "+" that hands over to the full
 * `EmojiPicker`. It is its own part rather than a mode of the picker because it
 * is shown in a different place (over a message, above its menu) and must stay
 * one row tall at 390px.
 */
import React from 'react';
import { View } from 'react-native';

import type { Button as ButtonComponent } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { REACTION_PICKER_EMOJIS, resolveChatComposerPalette } from './shared';
import type { ReactionPickerProps } from './types';
import { useChatComposerWebCss } from './web-hooks';
import { useMessages } from '../locale/messages';
import { CHAT_COMPOSER_MESSAGES } from './messages';

/** Platform dependencies are bound once; shared rendering adds no wrapper. */
export function createReactionPicker({ Surface, Button }: {
  Surface: typeof SurfaceComponent;
  Button: typeof ButtonComponent;
}) {

  const BOX = { sm: 30, md: 36 } as const;
  const GLYPH = { sm: 'title-3-regular', md: 'title-2-regular' } as const;

  function ReactionPicker({
    emojis = REACTION_PICKER_EMOJIS,
    selected,
    onSelectEmoji,
    onMorePress,
    moreLabel: moreLabelProp,
    size: sizeProp,
    surface = true,
    style,
    testID,
    accessibilityLabel: accessibilityLabelProp,
    emojiLabel,
  }: ReactionPickerProps) {
  const { size: inheritedSize } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const size = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';

    const theme = useTheme();
    const raisedFill = useCardFill(style);
    const parentFill = useSurfaceFill();
    const palette = resolveChatComposerPalette(theme, surface ? raisedFill : parentFill);
    const { messages } = useMessages(CHAT_COMPOSER_MESSAGES);
    const moreLabel = moreLabelProp ?? messages.moreReactions;
    const accessibilityLabel = accessibilityLabelProp ?? messages.quickReactions;
    useChatComposerWebCss();
    const box = BOX[size];

    const Container = surface ? Surface : View;
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
      '--bloom-chat-composer-ring': palette.focusRing,
    };

    const cell: WebCssStyle = {
      width: box, height: box, minWidth: box, minHeight: box, flexShrink: 0, padding: 0, borderRadius: 9999,
    };

    return (
      <Container
        accessibilityLabel={accessibilityLabel}
        style={[bar, style]}
        testID={testID}>
        {emojis.map((emoji) => {
          const active = selected === emoji;
          return (
            <Button
              key={emoji}
              appearance="plain"
              tone={active ? 'accent' : 'neutral'}
              accessibilityLabel={emojiLabel ? emojiLabel(emoji) : emoji}
              pressed={active}
              onPress={() => onSelectEmoji?.(emoji)}
              style={cell}
              testID={testID ? `${testID}-${emoji}` : undefined}>
              <Text variant={GLYPH[size]}>{emoji}</Text>
            </Button>
          );
        })}
        {onMorePress ? (
          <Button
            appearance="subtle"
            tone="neutral"
            accessibilityLabel={moreLabel}
            onPress={onMorePress}
            iconOnly
            icon={RiAddLine}
            iconSize={18}
            style={cell}
            testID={testID ? `${testID}-more` : undefined} />
        ) : null}
      </Container>
    );
  }

  return ReactionPicker;
}
