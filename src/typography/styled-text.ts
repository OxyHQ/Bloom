import type { ComponentType } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { styled } from 'react-native-css';

type StyledTextComponent = ComponentType<TextProps & { className?: string }>;

/**
 * RN `Text` wired for NativeWind `className` → `style` interop.
 *
 * Import `styled` from Bloom's direct dependency `react-native-css` — not via
 * lazy `require('nativewind')`. Metro cannot reliably bundle dynamic requires
 * from published `@oxyhq/bloom/lib`, so the 0.29.4 lazy path left interop
 * inactive at runtime and Bloom defaults (fontSize 13) overrode hero utilities.
 */
const interopText: StyledTextComponent = styled(RNText, { className: 'style' });

export function getInteropText(): StyledTextComponent {
  return interopText;
}

/** True when className interop is active (always — react-native-css is a direct dep). */
export function hasTypographyClassNameInterop(): boolean {
  return true;
}
