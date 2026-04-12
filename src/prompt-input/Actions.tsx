import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePromptInput } from './context';
import type { PromptInputActionsProps } from './types';

export function PromptInputActions({
  children,
  style,
  testID,
}: PromptInputActionsProps) {
  const { isFullscreen } = usePromptInput();
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        isFullscreen && {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 672,
          alignSelf: 'center',
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
PromptInputActions.displayName = 'PromptInputActions';
