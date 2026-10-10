import React, { forwardRef, type ComponentType, type RefAttributes } from 'react';
import type { View } from 'react-native';
import type { ButtonProps } from '../button/types';
import { useTheme } from '../theme/use-theme';
import { CONTROL_SIZE, resolveChatComposerPalette } from './shared';
import type { ComposerIconButtonProps } from './types';

/** Geometry adapter; Button owns paint, interaction, focus and disabled state. */
export function createComposerIconButton(Button: ComponentType<ButtonProps & RefAttributes<View>>) {
  return forwardRef<View, ComposerIconButtonProps>(function ComposerIconButton(
    {
      icon,
      accessibilityLabel,
      onPress,
      onLongPress,
      onPressIn,
      onPressOut,
      onLayout,
      disabled = false,
      tone = 'plain',
      size = CONTROL_SIZE,
      iconSize,
      style,
      testID,
      'aria-expanded': ariaExpanded,
      'aria-haspopup': ariaHasPopup,
    },
    ref,
  ) {
    const palette = resolveChatComposerPalette(useTheme());
    const accent = tone === 'accent';
    return (
      <Button
        ref={ref}
        onLayout={onLayout}
        appearance={accent ? 'solid' : 'plain'}
        tone={accent ? 'accent' : 'neutral'}
        iconOnly
        icon={icon}
        iconSize={iconSize ?? Math.max(16, size - 16)}
        colors={{
          background: accent ? palette.send.rest.background : 'transparent',
          foreground: accent ? palette.onAccent : palette.iconPrimary,
        }}
        accessibilityLabel={accessibilityLabel}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup === true ? 'menu' : ariaHasPopup || undefined}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          {
            width: size,
            height: size,
            minWidth: 0,
            minHeight: 0,
            flexShrink: 0,
            borderRadius: 9999,
            padding: 0,
          },
          style,
        ]}
        testID={testID}
      />
    );
  });
}
