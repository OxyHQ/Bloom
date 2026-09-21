import React, { useMemo } from 'react';
import { View, type TextStyle } from 'react-native';

import { Chip } from '../chip';
import { useContainerWidth } from '../hooks/use-container-width';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { resolveSelectionPaint, SelectionCard } from '../listing-editor/SelectionCard';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  VEHICLE_ICON,
  VEHICLE_OPTIONS,
  VEHICLE_PICKER_GEOMETRY,
  VEHICLE_PICKER_LABELS,
} from './constants';
import { vehicleOptionName } from './shared';
import type { VehicleKind, VehicleOption, VehiclePickerProps } from './types';

/**
 * Which vehicle the job needs: a column of selectable vehicle cards, each one
 * saying what it can take, what fits in it and what it starts at.
 *
 *   heading   `title` at `body-semibold` over `description` at
 *             `body-2-regular`, the shape a search panel's pickers use, 16
 *             above the first option. Omit both and the picker starts at the
 *             list
 *   option    the editor's selectable card: a 44 icon tile, the vehicle's name
 *             at `headline-semibold`, its capacity under it, and the radio
 *             indicator on the right
 *   detail    under the card's hairline: the `fits` nouns as outlined chips,
 *             then a "From · amount" line in tabular figures
 *   blocked   a disabled card, dimmed, with its reason on a warning-toned line
 *             under the detail — and the same reason inside the card's name, so
 *             it is announced rather than merely drawn
 *
 * ONE ANSWER. The group is a `radiogroup` and every card a `radio`: a job goes
 * in one vehicle, and an empty selection is a job that has not chosen yet.
 *
 * THE DETAIL IS NOT A DISCLOSURE. Every card shows its capacity, its chips and
 * its price at rest, because the question the picker answers is a COMPARISON —
 * a card that reveals its numbers only once chosen makes the user select four
 * vehicles to choose one.
 *
 * MONEY ARRIVES FORMATTED. `priceFrom` is drawn exactly as given; nothing here
 * adds, converts or rounds an amount.
 */

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

export function VehiclePicker<T extends string = VehicleKind>({
  value,
  onValueChange,
  options = VEHICLE_OPTIONS as unknown as readonly VehicleOption<T>[],
  title,
  description,
  disabled = false,
  labels: labelOverrides,
  accessibilityLabel = 'Vehicle',
  style,
  testID,
}: VehiclePickerProps<T>) {
  const theme = useTheme();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const labels = useMemo(() => ({ ...VEHICLE_PICKER_LABELS, ...labelOverrides }), [labelOverrides]);
  // The picker measures ITSELF: the same component is a full phone column and a
  // 420-wide panel beside a map, and the window cannot tell those apart.
  const { width, onLayout } = useContainerWidth();
  const compact = width !== null && width < VEHICLE_PICKER_GEOMETRY.narrowWidth;
  const warning = useMemo(() => resolveAccentColors(theme.colors, 'warning', 'subtle'), [theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <View testID={testID} onLayout={onLayout} style={style}>
      {title || description ? (
        <View style={{ gap: 2, marginBottom: VEHICLE_PICKER_GEOMETRY.headingGap }}>
          {title ? (
            <Text
              variant="body-semibold"
              role="heading"
              aria-level={3}
              style={{ color: paint.text }}
              testID={id('title')}
            >
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        role="radiogroup"
        accessibilityLabel={accessibilityLabel}
        style={{ gap: VEHICLE_PICKER_GEOMETRY.gap }}
      >
        {options.map((option) => {
          const blocked = disabled || option.disabled === true;
          const reason = option.disabled === true ? (option.unavailableReason ?? labels.unavailable) : undefined;
          const chips = option.fits ?? [];
          const hasDetail = chips.length > 0 || option.priceFrom !== undefined || reason !== undefined;
          const icon =
            option.icon ?? VEHICLE_ICON[option.value as unknown as VehicleKind] ?? undefined;

          return (
            <SelectionCard
              key={option.value}
              selection="single"
              selected={value === option.value}
              // A disabled card never reaches this, and the card itself stops
              // re-reporting a choice already made.
              onPress={() => {
                if (value !== option.value) onValueChange(option.value);
              }}
              title={option.label}
              description={option.capacity}
              icon={icon}
              compact={compact}
              disabled={blocked}
              // The name carries the capacity and the reason, because both are
              // drawn as separate lines that no name computation would reach.
              accessibilityLabel={vehicleOptionName(option, { from: labels.from, reason })}
              testID={id(option.value)}
            >
              {hasDetail ? (
                <View style={{ gap: VEHICLE_PICKER_GEOMETRY.chipGap }}>
                  {chips.length > 0 ? (
                    <View
                      role="group"
                      accessibilityLabel={labels.fits(option.label)}
                      testID={id(`${option.value}-fits`)}
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: VEHICLE_PICKER_GEOMETRY.chipGap,
                      }}
                    >
                      {chips.map((fit) => (
                        <Chip key={fit} size="medium" variant="outlined">
                          {fit}
                        </Chip>
                      ))}
                    </View>
                  ) : null}

                  {option.priceFrom !== undefined ? (
                    <View
                      testID={id(`${option.value}-price`)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <Text variant="body-regular" style={{ color: paint.textSecondary }}>
                        {labels.from}
                      </Text>
                      <Text
                        variant="body-semibold"
                        style={[{ color: paint.text, textAlign: 'right' }, TABULAR]}
                      >
                        {option.priceFrom}
                      </Text>
                    </View>
                  ) : null}

                  {reason ? (
                    <View
                      testID={id(`${option.value}-reason`)}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}
                    >
                      <View style={{ paddingTop: 1 }}>
                        <RiErrorWarningLine width={16} height={16} fill={warning.foreground} />
                      </View>
                      <Text
                        variant="body-2-regular"
                        style={{ flex: 1, minWidth: 0, color: warning.foreground }}
                      >
                        {reason}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </SelectionCard>
          );
        })}
      </View>
    </View>
  );
}

VehiclePicker.displayName = 'VehiclePicker';
