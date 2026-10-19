import type { RichTextStyle } from '@oxy.so/bloom-text';
import { Platform, StyleSheet, Text, type ViewStyle, View } from 'react-native';
import type { TextRun } from './text-runs';

/** The font the input draws inline code in, where the theme names none. */
export const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

/**
 * Runs drawn over a block's input while it is not being edited (the input
 * stays below, invisible, and still takes the press that starts editing).
 */
export function RunsText({
  runs,
  textStyle,
  style,
}: {
  runs: readonly TextRun[];
  textStyle: RichTextStyle;
  style?: ViewStyle;
}) {
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
          fontFamily: textStyle.fontFamily,
          fontWeight: textStyle.fontWeight,
        }}
      >
        {runs.map((run, index) => (
          // Runs have no identity beyond their place in the text.
          // biome-ignore lint/suspicious/noArrayIndexKey: the runs are the text, in order.
          <Text key={index} style={run.style}>
            {run.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}
