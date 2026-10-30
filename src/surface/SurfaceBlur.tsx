import { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { pointerEventsStyle } from '../styles/pointer-events';
import { useTheme } from '../theme/use-theme';

/**
 * The system's material under a floating surface on iOS: a `UIVisualEffectView`
 * (expo-blur's `BlurView`, which needs no blur target on iOS) with the thinnest
 * system material, so the blur and its saturation are the platform's and the
 * tint over it stays Bloom's own. Light or dark follows the theme, not the
 * window, so a surface never takes the other mode's material.
 *
 * Only `SurfacePaint` mounts it, only on iOS, only for a floating surface, and
 * only while transparency is not reduced: the caller decides all four
 * (`surface-ios-blur.test.tsx` keeps the list of floating callers an equality).
 * Never on Android, where a `BlurView` inside its own blur target crashes the
 * render thread (`blur/blur-target.tsx`).
 */
export const SurfaceBlur = memo(function SurfaceBlur({ style }: { style?: StyleProp<ViewStyle> }) {
  const { isDark } = useTheme();
  return (
    <BlurView
      intensity={100}
      tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
      style={[[StyleSheet.absoluteFill, style], pointerEventsStyle('none')]}
    />
  );
});
