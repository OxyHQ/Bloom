import type { RichTextStyle } from '@oxy.so/bloom-text';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, type ViewStyle, View } from 'react-native';
import type { TextRangeDecoration } from './decorations';
import { decorateRuns } from './range-decorations';
import { InlineCaret } from './RangeMarks';
import type { TextRun } from './text-runs';

/** The font the input draws inline code in, where the theme names none. */
export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

/**
 * The font text is drawn in where the text style names none: the input's own.
 * On web the input's editing surface inherits the page's font, while a
 * react-native-web `Text` sets a system font of its own — the drawn text
 * would be wider or narrower than the text under it, and every highlight and
 * caret off by the difference. Native inputs and `Text` share the system font.
 */
const INPUT_DEFAULT_FONT = Platform.OS === 'web' ? 'inherit' : undefined;

/** The font size a caret is drawn at where the text style names none. */
const DEFAULT_FONT_SIZE = 16;

/**
 * Runs drawn over a block's input while it is not being edited (the input
 * stays below, invisible, and still takes the press that starts editing),
 * with the application's highlights and carets laid in.
 */
export function RunsText({
  runs,
  ranges,
  textStyle,
  flagTextColor,
  style,
}: {
  runs: readonly TextRun[];
  /** Highlights and carets in the text (`BlockDecoration.ranges`). */
  ranges?: readonly TextRangeDecoration[];
  textStyle: RichTextStyle;
  /** The text of a caret's name flag. */
  flagTextColor: string;
  style?: ViewStyle;
}) {
  const items = useMemo(() => decorateRuns(runs, ranges), [runs, ranges]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[StyleSheet.absoluteFill, style]}
    >
      <Text
        style={{
          color: textStyle.color,
          fontSize: textStyle.fontSize,
          lineHeight: textStyle.lineHeight,
          fontFamily: textStyle.fontFamily ?? INPUT_DEFAULT_FONT,
          fontWeight: textStyle.fontWeight,
        }}
      >
        {items.map((item, index) =>
          // Runs have no identity beyond their place in the text.
          item.kind === 'text' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: the runs are the text, in order.
            <Text key={index} style={item.style}>
              {item.text}
            </Text>
          ) : (
            <InlineCaret
              // biome-ignore lint/suspicious/noArrayIndexKey: carets are placed by position.
              key={index}
              color={item.color}
              label={item.label}
              fontSize={textStyle.fontSize ?? DEFAULT_FONT_SIZE}
              textColor={flagTextColor}
            />
          ),
        )}
      </Text>
    </View>
  );
}
