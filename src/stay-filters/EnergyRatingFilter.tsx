import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { FOCUS_RING_OFFSET_COLOR } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ENERGY_RATINGS } from './constants';
import type { EnergyRating, EnergyRatingFilterProps } from './types';
import { contrastRatio, relativeLuminance } from '../styles/color-contrast';
import { webDataSet } from '../styles/web-data';

/**
 * An energy rating threshold, A (best) to G (worst), as seven small coloured
 * letter pills running green to red.
 *
 * "AND BETTER": the value is the WORST rating accepted. Choosing `C` matches
 * A, B and C — the pills from A up to the chosen one keep their colour, the
 * rest turn neutral, and the line under the row reads "C and better". `null`
 * (nothing chosen) is any rating: every pill is coloured. Pressing the chosen
 * letter again clears it.
 *
 *   pill       32 tall, at least 40 wide, full pill, 6 apart; the letter
 *              body-semibold
 *   colours    success → warning → error from the theme: the 500 stops of the
 *              three status ramps, with the two letters between each pair
 *              mixed at thirds (sRGB). The letter takes white or near-black,
 *              whichever contrasts more with that fill.
 *   excluded   neutral-100 (dark neutral-800) fill, text-secondary letter
 *   chosen     a 2px text-primary ring (every pill carries a 2px border, so
 *              the ring moves nothing)
 *   summary    body-2-regular, text-secondary, 12 under the row
 *
 * A `radiogroup`; each pill a `radio` with `aria-checked`, named by the
 * summary it would set ("C and better").
 */

const STYLE_ID = 'bloom-energy-rating-web-css';
const SELECTOR = '[data-bloom-energy-pill]';
const CSS = `
${SELECTOR} {
  outline: none;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
${SELECTOR}[aria-disabled="true"] {
  cursor: default;
}
${SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-energy-ring, currentColor);
}
@media (prefers-reduced-motion: reduce) {
  ${SELECTOR} { transition: none; }
}
`;

export const ENERGY_PILL_HEIGHT = 32;

export interface EnergyRatingPaint {
  fill: string;
  foreground: string;
}

/** The seven fills, A → G, each with its legible letter colour. Pure. */
export function resolveEnergyRatingPaint(theme: Theme): Record<EnergyRating, EnergyRatingPaint> {
  const c = theme.colors;
  const { neutral } = resolveButtonRamps(theme);
  // The theme's status colours are the 500 stops of their ramps.
  const { success, warning, error } = c;
  const fills: string[] = [
    success,
    mixColor(success, warning, 1 / 3),
    mixColor(success, warning, 2 / 3),
    warning,
    mixColor(warning, error, 1 / 3),
    mixColor(warning, error, 2 / 3),
    error,
  ];
  const light = '#ffffff';
  const dark = neutral[950];
  const out = {} as Record<EnergyRating, EnergyRatingPaint>;
  ENERGY_RATINGS.forEach((rating, i) => {
    const fill = fills[i] as string;
    out[rating] = {
      fill,
      foreground: contrastRatio(fill, light) >= contrastRatio(fill, dark) ? light : dark,
    };
  });
  return out;
}

export function defaultEnergySummary(value: EnergyRating | null): string {
  if (value == null) return 'Any rating';
  if (value === 'A') return 'A only';
  return `${value} and better`;
}

interface PillProps {
  rating: EnergyRating;
  paint: EnergyRatingPaint;
  included: boolean;
  checked: boolean;
  disabled: boolean;
  name: string;
  onPress: () => void;
  testID?: string;
}

function Pill({ rating, paint, included, checked, disabled, name, onPress, testID }: PillProps) {
  const theme = useTheme();
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hover = useInteractionState();
  const dark = theme.isDark;
  const border = checked ? theme.colors.text : hover.state && !disabled ? (dark ? neutral[500] : neutral[400]) : 'transparent';

  const style: WebCssStyle = {
    height: ENERGY_PILL_HEIGHT,
    minWidth: 40,
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: border,
    backgroundColor: included ? paint.fill : dark ? neutral[800] : neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    '--bloom-energy-ring': accent[500],
  };

  return (
    <Pressable
      role="radio"
      accessibilityLabel={name}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={hover.onIn}
      onHoverOut={hover.onOut}
      testID={testID}
      {...webDataSet({ bloomEnergyPill: included ? 'included' : '' })}
      style={style}
    >
      <Text
        variant="body-semibold"
        style={{ color: included ? paint.foreground : theme.colors.textSecondary }}
      >
        {rating}
      </Text>
    </Pressable>
  );
}

function EnergyRatingFilterComponent({
  value,
  onValueChange,
  formatSummary = defaultEnergySummary,
  accessibilityLabel = 'Energy rating',
  disabled = false,
  style,
  testID,
}: EnergyRatingFilterProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  const paint = useMemo(() => resolveEnergyRatingPaint(theme), [theme]);
  const threshold = value == null ? ENERGY_RATINGS.length - 1 : ENERGY_RATINGS.indexOf(value);

  return (
    <View testID={testID} style={[{ gap: 12 }, style]}>
      <View
        role="radiogroup"
        accessibilityLabel={accessibilityLabel}
        aria-disabled={disabled || undefined}
        style={{ flexDirection: 'row', gap: 6 }}
      >
        {ENERGY_RATINGS.map((rating, i) => (
          <Pill
            key={rating}
            rating={rating}
            paint={paint[rating]}
            included={i <= threshold}
            checked={rating === value}
            disabled={disabled}
            name={formatSummary(rating)}
            onPress={() => onValueChange(rating === value ? null : rating)}
            testID={testID ? `${testID}-${rating}` : undefined}
          />
        ))}
      </View>
      <Text
        variant="body-2-regular"
        testID={testID ? `${testID}-summary` : undefined}
        style={{ color: theme.colors.textSecondary }}
      >
        {formatSummary(value)}
      </Text>
    </View>
  );
}

export const EnergyRatingFilter = memo(EnergyRatingFilterComponent);
EnergyRatingFilter.displayName = 'EnergyRatingFilter';

export { contrastRatio };
