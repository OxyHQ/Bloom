import React, { memo, useMemo, useState } from 'react';
import { View } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { RiMapPin2Fill } from '../icons/remix/RiMapPin2Fill';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveSelectionPaint, SelectionCard } from './SelectionCard';
import type { AddressPrecision, AddressPrecisionOption, AddressPrecisionPickerProps } from './types';

/**
 * How precisely the published listing shows where the home is: three radio
 * cards, each with a map preview over its title and explanation.
 *
 *   layout    three cards side by side from 720 wide, stacked below
 *   card      the listing editor's selection card (radius 16, 2px text-primary
 *             border when selected) with Bloom's `RadioIndicator` at 20 beside
 *             the title
 *   map       112 tall (96 stacked), radius 12, inset 12 — `renderMap(precision)`
 *             or Bloom's placeholder: a neutral-100 (dark neutral-800) street
 *             grid with a pin (exact), the street drawn in the accent (street),
 *             or an accent circle at 20% over the grid (approximate)
 *   footnote  caption-1-regular, text-secondary, 12 under the cards
 *
 * THE CHOICE DECIDES WHAT IS PUBLISHED. The component only records it; the app
 * must derive the public location from `value` on its server — exact
 * coordinates for `exact`, the street's centreline for `street`, and a point
 * jittered inside roughly 500 m for `approximate` — and never send the exact
 * coordinates to a client that should not see them.
 *
 * Accessibility: a `radiogroup` of `radio`s with `aria-checked`, each named by
 * its title with the explanation as its hint. The map previews are decorative.
 */

export const DEFAULT_ADDRESS_PRECISION_OPTIONS: ReadonlyArray<AddressPrecisionOption> = [
  {
    value: 'exact',
    title: 'Exact address',
    description: 'The pin sits on the building. Best for homes that are easy to find anyway.',
  },
  {
    value: 'street',
    title: 'Street only',
    description: 'Shows the street, not the number. The exact address is shared after booking or signing.',
  },
  {
    value: 'approximate',
    title: 'Approximate area',
    description: 'Shows a circle of about 500 m. The most private option.',
  },
];

const DEFAULT_FOOTNOTE =
  'The published map follows this choice. Your exact address is only shared with people you confirm.';

interface MapPaint {
  ground: string;
  block: string;
  road: string;
  accent: string;
  accentWash: string;
  pin: string;
}

function resolveMapPaint(theme: Theme): MapPaint {
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const ground = theme.colors.backgroundSecondary;
  return {
    ground,
    block: theme.colors.backgroundTertiary,
    road: theme.colors.background,
    accent: accent[500],
    accentWash: mixColor(ground, accent[500], 0.2),
    pin: theme.colors.text,
  };
}

/** Bloom's placeholder map for one precision. Decorative. */
export function PrecisionMapPlaceholder({ precision, height }: { precision: AddressPrecision; height: number }) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapPaint(theme), [theme]);
  const circle = Math.round(height * 0.72);

  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height, backgroundColor: paint.ground, overflow: 'hidden' }}
    >
      {/* City blocks */}
      {[0.08, 0.62].map((top) =>
        [0.04, 0.3, 0.62].map((left) => (
          <View
            key={`${top}-${left}`}
            style={{
              position: 'absolute',
              top: `${top * 100}%`,
              left: `${left * 100}%`,
              width: '20%',
              height: '28%',
              borderRadius: 4,
              backgroundColor: paint.block,
            }}
          />
        )),
      )}
      {/* The street the home is on, and a cross street */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '44%',
          height: 10,
          backgroundColor: precision === 'street' ? paint.accent : paint.road,
        }}
      />
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: '55%', width: 8, backgroundColor: paint.road }} />
      {precision === 'approximate' ? (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '42%',
            width: circle,
            height: circle,
            marginTop: -circle / 2,
            marginLeft: -circle / 2,
            borderRadius: circle / 2,
            borderWidth: 2,
            borderColor: paint.accent,
            backgroundColor: paint.accentWash,
          }}
        />
      ) : null}
      {precision === 'exact' ? (
        <View style={{ position: 'absolute', top: '50%', left: '42%', marginTop: -30, marginLeft: -14 }}>
          <RiMapPin2Fill width={28} height={28} fill={paint.pin} />
        </View>
      ) : null}
    </View>
  );
}

function AddressPrecisionPickerComponent({
  value,
  onValueChange,
  renderMap,
  options = DEFAULT_ADDRESS_PRECISION_OPTIONS,
  footnote = DEFAULT_FOOTNOTE,
  accessibilityLabel = 'Address precision',
  disabled = false,
  style,
  testID,
}: AddressPrecisionPickerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const [width, setWidth] = useState(0);
  const row = width >= 720;
  const mapHeight = row ? 112 : 96;

  return (
    <View testID={testID} style={[{ gap: 12 }, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View
        role="radiogroup"
        accessibilityLabel={accessibilityLabel}
        aria-disabled={disabled || undefined}
        style={{ flexDirection: row ? 'row' : 'column', alignItems: row ? 'stretch' : undefined, gap: 12 }}
      >
        {options.map((option) => (
          <SelectionCard
            key={option.value}
            selection="single"
            indicator="radio"
            selected={value === option.value}
            onPress={() => {
              if (value !== option.value) onValueChange(option.value);
            }}
            title={option.title}
            description={option.description}
            media={renderMap ? renderMap(option.value) : <PrecisionMapPlaceholder precision={option.value} height={mapHeight} />}
            disabled={disabled}
            style={row ? { flex: 1, flexBasis: 0 } : undefined}
            testID={testID ? `${testID}-${option.value}` : undefined}
          />
        ))}
      </View>
      {footnote ? (
        <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

export const AddressPrecisionPicker = memo(AddressPrecisionPickerComponent);
AddressPrecisionPicker.displayName = 'AddressPrecisionPicker';
