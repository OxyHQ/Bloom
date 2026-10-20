import { Platform, View, type ViewStyle } from 'react-native';
import type { CoverFillProps } from './types';
/** Decorative fill shared by full cover bands and compact previews. */
export function CoverFill({ color, gradient, style, testID }: CoverFillProps) {
  const image = gradient
    ? `linear-gradient(${gradient.angle ?? 135}deg, ${gradient.from} 0%, ${gradient.to} 100%)`
    : undefined;
  const paint: ViewStyle & { backgroundImage?: string } =
    Platform.OS === 'web' ? { backgroundImage: image } : { experimental_backgroundImage: image };
  return (
    <View
      testID={testID}
      aria-hidden
      style={[
        { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: color, ...paint },
        style,
      ]}
    />
  );
}
