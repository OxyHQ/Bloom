/**
 * "This message was deleted" is legible on both sides of the conversation.
 *
 * It was drawn in the theme's `muted` colour, which knows nothing about the
 * bubble behind it: on an outgoing (accent) bubble it was dark on dark (Allo,
 * Pixel 8a). It now takes the side's meta ink, checked against that fill, and
 * keeps room for its italic slant.
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { MessageBubble } from '../message-bubble';
import { resolveMessageBubblePaint } from '../message-bubble/shared';
import { contrastRatio } from '../styles/color-contrast';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

let theme: Theme;
function ReadTheme() {
  theme = useTheme();
  return null;
}

function deletedLine(direction: 'incoming' | 'outgoing'): TextStyle {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ReadTheme />
      <MessageBubble
        direction={direction}
        deleted
        labels={{ deleted: 'This message was deleted' }}
      />
    </BloomThemeProvider>,
  );
  const line = screen
    .UNSAFE_getAllByType(Text)
    .find((node) => node.props.children === 'This message was deleted');
  if (!line) throw new Error('no deleted line');
  return StyleSheet.flatten(line.props.style) as TextStyle;
}

describe('a deleted message', () => {
  it.each(['incoming', 'outgoing'] as const)('reads clearly on an %s bubble', (direction) => {
    const style = deletedLine(direction);
    const fill = resolveMessageBubblePaint(theme)[direction].fill;
    expect(contrastRatio(String(style.color), fill)).toBeGreaterThanOrEqual(4.5);
    expect(style.fontStyle).toBe('italic');
    expect(style.paddingRight).toBeGreaterThan(0);
  });
});
