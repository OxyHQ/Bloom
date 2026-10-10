import React, { memo, type ComponentType } from 'react';
import { useBloomAppearance } from '../appearance';
import type { ButtonProps } from '../button/types';
import { resolveFrostedSize } from './shared';
import type { FrostedIconButtonProps } from './types';

const DEFAULT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Geometry and toggle adapter; Button owns material, interaction and semantics. */
export function createFrostedIconButton(Button: ComponentType<ButtonProps>, web = false) {
  const FrostedIconButton = memo(function FrostedIconButton({
    icon,
    tone: toneProp,
    checked = false,
    onCheckedChange,
    onPress,
    onClick,
    size: sizeProp,
    style,
    className,
    disabled = false,
    hitSlop,
    accessibilityLabel,
    accessibilityHint,
    'aria-label': ariaLabel,
    ...rest
  }: FrostedIconButtonProps) {
    const { size, tone } = useBloomAppearance(
      { size: typeof sizeProp === 'number' ? undefined : sizeProp, tone: toneProp },
      { size: 'md', tone: 'accent' },
    );
    const geometry = resolveFrostedSize(typeof sizeProp === 'number' ? sizeProp : size);
    return (
      <Button
        {...rest}
        appearance="solid"
        tone={checked ? tone : 'neutral'}
        pressed={checked}
        icon={icon}
        iconOnly
        iconSize={geometry.iconBox}
        disabled={disabled}
        accessibilityLabel={web ? (ariaLabel ?? accessibilityLabel) : accessibilityLabel}
        accessibilityHint={accessibilityHint}
        className={className}
        hitSlop={hitSlop ?? DEFAULT_HIT_SLOP}
        style={[
          {
            width: geometry.diameter,
            height: geometry.diameter,
            minHeight: geometry.diameter,
            borderRadius: geometry.diameter / 2,
          },
          disabled && { opacity: 0.5 },
          style,
        ]}
        onPress={(event) => {
          if (disabled) return;
          if (web) onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
          onCheckedChange?.(!checked);
          onPress?.();
        }}
      />
    );
  });
  FrostedIconButton.displayName = 'FrostedIconButton';
  return FrostedIconButton;
}
