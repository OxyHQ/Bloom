/**
 * A reaction-bar cell gives its emoji the whole cell on native.
 *
 * React Native ranks `paddingLeft` above `paddingHorizontal` above `padding`,
 * whatever the order in the style array. The cell passed `padding: 0`, Button
 * keeps an 8dp `paddingHorizontal`, so the 30dp cell left the emoji a 14dp slot
 * and every one was cut in half (Allo's message menu, Pixel 8a).
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';

import { Button } from '../button';
import { ReactionPicker } from '../chat-composer';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/** The horizontal padding React Native lays out, by its own precedence. */
function effective(style: ViewStyle, side: 'paddingLeft' | 'paddingRight'): unknown {
  return style[side] ?? style.paddingHorizontal ?? style.padding ?? 0;
}

describe('ReactionPicker cell', () => {
  it('lays the emoji out across the whole cell', () => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ReactionPicker emojis={['👍', '❤️']} onSelectEmoji={() => {}} size="sm" />
      </BloomThemeProvider>,
    );
    const cells = screen
      .UNSAFE_getAllByType(Button)
      .filter(
        (node) => node.props.accessibilityLabel === '👍' || node.props.accessibilityLabel === '❤️',
      );
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      // The HOST view the Button renders: the one whose style React Native lays out.
      const [host] = cell.findAll(
        (node) => typeof node.type === 'string' && node.props.accessibilityRole === 'button',
      );
      if (!host) throw new Error('no host for the cell');
      const style = StyleSheet.flatten(host.props.style) as ViewStyle;
      expect(effective(style, 'paddingLeft')).toBe(0);
      expect(effective(style, 'paddingRight')).toBe(0);
    }
  });
});
