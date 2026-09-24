import React, { Children, isValidElement, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { RiLinkM } from '../icons/remix/RiLinkM';
import { Text } from '../typography';
import { AiChatFeedbackRowBase } from './AiChatFeedbackRowBase';
import { RevealFade, RevealLine, RevealSequence, useRevealSlot } from './AiChatReveal';
import { CARD_RADIUS, dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss } from './shared';
import type {
  AiChatAssistantMessageProps,
  AiChatBulletListProps,
  AiChatBulletProps,
  AiChatLinkChipProps,
  AiChatMessageLineProps,
  AiChatStrongProps,
  AiChatUserMessageProps,
} from './types';

/**
 * Thread turns (`UserMessage`, `AssistantMessage`, `Line`, `Bullets`,
 * `Bullet`, `LinkChip`).
 *
 *   user       pushed right with a 6px bleed past the column (`-mr-1.5`), hugging
 *              its text up to half the column + 6; radius 16, background-primary,
 *              px 12 / py 11, shadow-card; body-regular text-primary, left-aligned
 *   assistant  full width, gap 8, body-regular text-primary; the feedback row last
 *   line       a paragraph; `secondary` tone for status lines
 *   bullets    disc markers outside a 21px indent, items 8 apart
 *   link chip  inline, radius 8, px 4 / py 3, accent-100 (`indigo-100`) with a 16px
 *              link glyph and caption-2-medium accent-500 (`indigo-500`) text, 2 gap
 *
 * Motion: each turn fades in (400ms) while its blocks rise, un-blur and fade in
 * 180ms apart (500ms each); a bullet list staggers its items the same way.
 */

function isLine(child: React.ReactNode): boolean {
  return (
    isValidElement(child) &&
    (child.type === AiChatMessageLine || child.type === AiChatBulletList)
  );
}

/**
 * Wraps anything that is not already a revealing block: text becomes a
 * paragraph line, any other element (a code card, an image) a block line.
 */
function asBlocks(children: React.ReactNode): React.ReactNode {
  return Children.map(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return child;
    if (isLine(child)) return child;
    if (typeof child === 'string' || typeof child === 'number') {
      return <AiChatMessageLine>{child}</AiChatMessageLine>;
    }
    return <AiChatMessageLine block>{child}</AiChatMessageLine>;
  });
}

export function AiChatUserMessage({ children, animate = true, style, testID }: AiChatUserMessageProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const [column, setColumn] = useState(0);
  return (
    <View
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => setColumn(event.nativeEvent.layout.width)}
      style={[{ width: '100%', alignItems: 'flex-end' }, style]}>
      <RevealFade
        animate={animate}
        style={{
          marginRight: -6,
          maxWidth: column > 0 ? column / 2 + 6 : '50%',
          flexDirection: 'column',
          borderRadius: CARD_RADIUS,
          backgroundColor: palette.primary,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 11,
          paddingBottom: 11,
          boxShadow: palette.shadowCard,
        }}>
        <RevealSequence animate={animate}>{asBlocks(children)}</RevealSequence>
      </RevealFade>
    </View>
  );
}

export function AiChatAssistantMessageBase({
  children,
  feedback = true,
  feedbackProps,
  animate = true,
  style,
  testID,
}: AiChatAssistantMessageProps) {
  useAiChatWebCss();
  return (
    <RevealFade animate={animate} testID={testID} style={[{ width: '100%', flexDirection: 'column', gap: 8 }, style]}>
      <RevealSequence animate={animate}>
        {asBlocks(children)}
        {feedback ? (
          <AiChatMessageLine block>
            <View style={{ alignSelf: 'flex-start' }}>
              <AiChatFeedbackRowBase {...feedbackProps} testID={testID ? `${testID}-feedback` : undefined} />
            </View>
          </AiChatMessageLine>
        ) : null}
      </RevealSequence>
    </RevealFade>
  );
}

export function AiChatMessageLine({ children, tone = 'primary', block = false, selectable = true, style }: AiChatMessageLineProps) {
  const palette = useAiChatPalette();
  return (
    <RevealLine style={style}>
      {block ? (
        children
      ) : (
        <Text selectable={selectable} variant="body-regular" style={{ color: tone === 'secondary' ? palette.textSecondary : palette.text }}>
          {children}
        </Text>
      )}
    </RevealLine>
  );
}

export function AiChatBulletList({ children, style }: AiChatBulletListProps) {
  const slot = useRevealSlot();
  return (
    <RevealFade animate={slot.animate} delay={slot.delay} style={[{ flexDirection: 'column', gap: 8, paddingLeft: 21 }, style]}>
      <RevealSequence animate={slot.animate} delay={slot.delay}>
        {children}
      </RevealSequence>
    </RevealFade>
  );
}

/** `list-disc` marker: a 5px disc in the 21px indent, 11px short of the text, centred on the first line. */
export function AiChatBullet({ children }: AiChatBulletProps) {
  const palette = useAiChatPalette();
  return (
    <RevealLine>
      <View style={{ position: 'relative' }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ position: 'absolute', left: -16, top: 8, width: 5, height: 5, borderRadius: 2.5, backgroundColor: palette.text }}
        />
        <Text variant="body-regular" style={{ color: palette.text }}>
          {children}
        </Text>
      </View>
    </RevealLine>
  );
}

/** `font-medium` inside a paragraph. */
export function AiChatStrong({ children }: AiChatStrongProps) {
  return <Text variant="body-medium">{children}</Text>;
}

export function AiChatLinkChip({ children, onPress }: AiChatLinkChipProps) {
  const palette = useAiChatPalette();
  return (
    <Text
      {...dataHook('bloomAiChatChip')}
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      accessibilityLabel={children}
      style={{
        borderRadius: 8,
        backgroundColor: palette.linkChipBackground,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 3,
        paddingBottom: 3,
        marginTop: -2,
        marginBottom: -2,
        marginRight: 4,
      }}>
      {IS_WEB ? (
        <RiLinkM width={16} height={16} fill={palette.linkChipText} />
      ) : (
        <View style={{ width: 16, height: 16 }}>
          <RiLinkM width={16} height={16} fill={palette.linkChipText} />
        </View>
      )}
      <Text variant="caption-2-medium" style={{ color: palette.linkChipText }}>
        {children}
      </Text>
    </Text>
  );
}
