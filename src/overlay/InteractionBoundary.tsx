import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

/** Stops interaction with caller-owned actions, including web keyboard focus. */
export function InteractionBoundary({
  disabled,
  children,
}: {
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <View
      collapsable={false}
      style={Platform.OS === 'web' ? { display: 'contents' } : undefined}
      pointerEvents={disabled ? 'none' : 'auto'}
      accessibilityElementsHidden={disabled}
      importantForAccessibility={disabled ? 'no-hide-descendants' : 'auto'}
      {...(Platform.OS === 'web' && disabled ? { inert: true } : null)}
    >
      {children}
    </View>
  );
}
