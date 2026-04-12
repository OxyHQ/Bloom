import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePromptInput } from './context';
import type { PromptInputSubmitButtonProps } from './types';

export function PromptInputSubmitButton({
  isLoading,
  onStop,
  emptyAction,
  submitIcon,
  stopIcon,
  style,
  testID,
}: PromptInputSubmitButtonProps) {
  const { onSubmit, value, attachments } = usePromptInput();
  const theme = useTheme();
  const hasContent = value.trim().length > 0 || attachments.length > 0;

  if (isLoading && onStop) {
    return (
      <TouchableOpacity
        onPress={onStop}
        activeOpacity={0.7}
        style={[
          {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        testID={testID}
      >
        {stopIcon ?? (
          <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>■</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (!hasContent && emptyAction) {
    return <>{emptyAction}</>;
  }

  return (
    <TouchableOpacity
      onPress={onSubmit}
      disabled={!hasContent}
      activeOpacity={0.7}
      style={[
        {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hasContent ? 1 : 0.4,
        },
        style,
      ]}
      testID={testID}
    >
      {submitIcon ?? (
        <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '700' }}>↑</Text>
      )}
    </TouchableOpacity>
  );
}
PromptInputSubmitButton.displayName = 'PromptInputSubmitButton';
