import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import { ArrowTop_Stroke2_Corner0_Rounded as ArrowTopIcon } from '../icons/Arrow';
import { usePromptInput } from './context';
import type { PromptInputSubmitButtonProps } from './types';

const BUTTON_SIZE = 32;
const ICON_SIZE = 18;
/** The stop square, as a fraction of the button. Drawn, not typed. */
const STOP_SQUARE = 0.34;
/** Press feedback, matching the `TouchableOpacity` dip this button used to pass. */
const PRESSED_OPACITY = 0.7;

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
  // The press dip goes through the shared interaction hook rather than
  // `TouchableOpacity`'s `activeOpacity`: one mechanism, and it composes with
  // the disabled dim below instead of replacing it.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const hasContent = value.trim().length > 0 || attachments.length > 0;

  if (isLoading && onStop) {
    return (
      <Pressable
        onPress={onStop}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Stop"
        style={[
          {
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: borderRadius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          },
          pressed && { opacity: PRESSED_OPACITY },
          style,
        ]}
        testID={testID}
      >
        {stopIcon ?? (
          <View
            style={{
              width: BUTTON_SIZE * STOP_SQUARE,
              height: BUTTON_SIZE * STOP_SQUARE,
              borderRadius: 2,
              backgroundColor: theme.colors.primaryForeground,
            }}
          />
        )}
      </Pressable>
    );
  }

  if (!hasContent && emptyAction) {
    return <>{emptyAction}</>;
  }

  return (
    <Pressable
      onPress={onSubmit}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!hasContent}
      accessibilityRole="button"
      accessibilityLabel="Send"
      style={[
        {
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: borderRadius.full,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hasContent ? 1 : 0.4,
        },
        hasContent && pressed && { opacity: PRESSED_OPACITY },
        style,
      ]}
      testID={testID}
    >
      {submitIcon ?? (
        <ArrowTopIcon
          width={ICON_SIZE}
          height={ICON_SIZE}
          fill={theme.colors.primaryForeground}
        />
      )}
    </Pressable>
  );
}
PromptInputSubmitButton.displayName = 'PromptInputSubmitButton';
