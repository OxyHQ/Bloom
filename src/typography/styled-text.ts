import type { ComponentType } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { lazyRequire } from '../utils/lazy-require';

type StyledTextComponent = ComponentType<TextProps & { className?: string }>;

type NativeWindModule = {
  styled: (
    component: typeof RNText,
    mapping?: { className: 'style' },
  ) => StyledTextComponent;
};

const getNativeWind = lazyRequire<NativeWindModule>('nativewind');

let interopText: StyledTextComponent = RNText;

/**
 * RN `Text` wired for NativeWind `className` → `style` interop when
 * `nativewind` is installed in the consumer. Falls back to plain `RNText`
 * otherwise (className is ignored upstream).
 */
export function getInteropText(): StyledTextComponent {
  if (interopText !== RNText) {
    return interopText;
  }

  const nativewind = getNativeWind();
  if (nativewind?.styled) {
    interopText = nativewind.styled(RNText, { className: 'style' });
  }

  return interopText;
}

/** True when className interop is active (nativewind present). */
export function hasTypographyClassNameInterop(): boolean {
  getInteropText();
  return interopText !== RNText;
}
