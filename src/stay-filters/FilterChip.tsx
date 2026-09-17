import React, { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Chip, CHIP_GEOMETRY, resolveChipPaint } from '../chip';
import { useTheme } from '../theme/use-theme';
import type { FilterIconComponent } from './types';

/**
 * The selectable pill both chip filters are built from. Internal: `CountFilter`
 * uses it as a radio, `ToggleChipGroup` as a toggle button, and the search's
 * `SaveSearchButton` as its bell toggle.
 *
 * It is a PRESET over `Chip`'s `2xl` rung and `inverted` fill, not a pill of
 * its own — it used to be, with its own stylesheet, its own hover and press
 * colours and its own focus ring, because `Chip` stopped at 28 tall and its
 * selection promoted to the brand tone. Both of those are now `Chip`'s (the
 * rung table and the `inverted` recipe are in `chip/shared.ts`):
 *
 *   geometry   40 tall, full pill, 1px border, px 16, 8 between icon (18) and
 *              label; minWidth 48 so "1" is not a dot
 *   rest       transparent fill, border neutral-200 (dark neutral-700), text
 *   hover      border text (web pointer only)
 *   press      fill neutral-100 (dark neutral-800)
 *   selected   INVERTED: fill + border text, label + icon the page background —
 *              the page's own reading pair turned over, so it is legible in both
 *              modes and under every preset
 *   disabled   50% opacity
 *
 * What this still owns is the housing filter's own vocabulary: an icon drawn at
 * the rung's size in the pill's CURRENT label colour (so it flips with the
 * selection), and `mode`, which decides whether the pill is a `radio` in a
 * radiogroup or a toggle `button`.
 *
 * Colour change only on hover and press — no scale.
 */

export const FILTER_CHIP_HEIGHT = CHIP_GEOMETRY['2xl'].height;
const ICON_SIZE = CHIP_GEOMETRY['2xl'].icon;

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` inside a radiogroup (`aria-checked`), `toggle` a pressed button (`aria-pressed`). */
  mode: 'radio' | 'toggle';
  icon?: FilterIconComponent;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function FilterChipComponent({
  label,
  selected,
  onPress,
  mode,
  icon: Icon,
  disabled = false,
  style,
  testID,
}: FilterChipProps) {
  return (
    <Chip
      size="2xl"
      variant="inverted"
      role={mode === 'radio' ? 'radio' : 'button'}
      selected={selected}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      startIcon={Icon ? <FilterChipIcon icon={Icon} selected={selected} /> : undefined}
      style={style}
      testID={testID}
    >
      {label}
    </Chip>
  );
}

/**
 * The icon takes the pill's CURRENT label colour, which inverts with the
 * selection. `Chip` sizes the slot; this only has to pick the fill, and it
 * reads it from the same recipe the label does rather than guessing.
 */
function FilterChipIcon({
  icon: Icon,
  selected,
}: {
  icon: NonNullable<FilterChipProps['icon']>;
  selected: boolean;
}) {
  const theme = useTheme();
  const { foreground } = resolveChipPaint(theme, {
    tone: 'default',
    variant: 'inverted',
    selected,
  });
  return <Icon width={ICON_SIZE} height={ICON_SIZE} fill={foreground} />;
}

export const FilterChip = memo(FilterChipComponent);
FilterChip.displayName = 'FilterChip';
