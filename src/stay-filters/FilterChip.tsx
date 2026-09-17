import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { FOCUS_RING_OFFSET_COLOR, webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { FilterIconComponent } from './types';

/**
 * The selectable pill both chip filters are built from. Internal: `CountFilter`
 * uses it as a radio, `ToggleChipGroup` as a toggle button.
 *
 *   geometry   40 tall, full pill, 1px border, px 16 (12 before an icon),
 *              8 between icon (18) and label; minWidth 48 so "1" is not a dot
 *   label      body-medium
 *   rest       transparent fill, border neutral-200 (dark neutral-700), text-primary
 *   hover      border text-primary (web pointer only)
 *   press      fill neutral-100 (dark neutral-800)
 *   selected   INVERTED: fill + border text-primary, label + icon the page
 *              background — the page's own reading pair turned over, so it is
 *              legible in both modes and under every preset
 *   disabled   50% opacity
 *
 * Why not `Chip`: its tallest size is 28 (too small a target for a filters
 * sheet on touch) and its selected state promotes to the brand tone, where
 * these pills invert. Colour change only on hover and press — no scale.
 */

const STYLE_ID = 'bloom-filter-chip-web-css';
const SELECTOR = '[data-bloom-filter-chip]';
const FILTER_CHIP_CSS = `
${SELECTOR} {
  outline: none;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
${SELECTOR}[aria-disabled="true"] {
  cursor: default;
}
${SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-filter-chip-ring, currentColor);
}
`;

export const FILTER_CHIP_HEIGHT = 40;
const ICON_SIZE = 18;

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` inside a radiogroup (`aria-checked`), `toggle` a pressed button (`aria-pressed`). */
  mode: 'radio' | 'toggle';
  icon?: FilterIconComponent;
  disabled?: boolean;
  testID?: string;
}

function FilterChipComponent({ label, selected, onPress, mode, icon: Icon, disabled = false, testID }: FilterChipProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, FILTER_CHIP_CSS);
  }, []);
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const dark = theme.isDark;
  const text = theme.colors.text;
  const foreground = selected ? theme.colors.background : text;
  const active = !disabled;

  const style: WebCssStyle = {
    height: FILTER_CHIP_HEIGHT,
    minWidth: 48,
    paddingLeft: Icon ? 12 : 16,
    paddingRight: 16,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: selected || (hovered && active) ? text : dark ? neutral[700] : neutral[200],
    backgroundColor: selected ? text : pressed && active ? (dark ? neutral[800] : neutral[100]) : 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
    '--bloom-filter-chip-ring': accent[500],
  };

  const stateProps =
    mode === 'radio'
      ? { accessibilityState: { checked: selected, disabled }, 'aria-checked': selected }
      : { accessibilityState: { selected, disabled }, 'aria-pressed': selected };

  return (
    <Pressable
      role={mode === 'radio' ? 'radio' : 'button'}
      accessibilityLabel={label}
      {...stateProps}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      testID={testID}
      {...webDataSet({ bloomFilterChip: '' })}
      style={style}
    >
      {Icon ? (
        <View style={{ width: ICON_SIZE, height: ICON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Icon width={ICON_SIZE} height={ICON_SIZE} fill={foreground} />
        </View>
      ) : null}
      <Text variant="body-medium" numberOfLines={1} style={{ color: foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

export const FilterChip = memo(FilterChipComponent);
FilterChip.displayName = 'FilterChip';
