import { StyleSheet } from 'react-native';
import { Surface } from '../surface/Surface';
import { useTheme } from '../theme/use-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { mixColors } from '../styles/color-contrast';
import { pointerEventsStyles } from '../styles/pointer-events';
import type { GroupedSectionIconProps } from './types';

/** Decorative icon badge; the row supplies its accessible name. */
export function GroupedSectionIcon({
  tone = 'primary',
  color,
  size = 28,
  iconSize = 16,
  children,
  testID,
}: GroupedSectionIconProps) {
  const theme = useTheme();
  const background = color ?? resolveAccentColors(theme.colors, tone, 'solid').background;
  const foreground = mixColors(background, '#000000', 0.6);
  return (
    <Surface
      fill={background}
      radius={size / 2}
      cornerCurve="round"
      testID={testID}
      accessible={false}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, pointerEventsStyles.none, { width: size, height: size }]}
    >
      {children({ color: foreground, size: iconSize })}
    </Surface>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
