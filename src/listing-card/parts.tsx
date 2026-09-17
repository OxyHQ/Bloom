import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { OfferingBadge } from '../offering-badge/OfferingBadge';
import { OFFERING_BADGE_GEOMETRY } from '../offering-badge/shared';
import type { OfferingBadgeSize, OfferingBadgeVariant } from '../offering-badge/types';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';
import { uniqueOfferings } from './shared';
import type { ListingFact, ListingPriceLine, Offering } from './types';

/**
 * The housing parts `ListingCard` and `MapListingPreview` both draw, so the two
 * cannot drift apart. Internal: not on the family barrel.
 *
 *   size      text                       icon
 *   medium    body-regular / -semibold    16     (the card)
 *   small     body-2-regular / -semibold  14     (the map preview)
 *
 * Facts are body-2 at both sizes: they are the densest line.
 */

export type ListingPartSize = 'medium' | 'small';

const REGULAR: Record<ListingPartSize, TypeScaleVariant> = { medium: 'body-regular', small: 'body-2-regular' };
const SEMIBOLD: Record<ListingPartSize, TypeScaleVariant> = { medium: 'body-semibold', small: 'body-2-semibold' };
const ICON: Record<ListingPartSize, number> = { medium: 16, small: 14 };

/** Horizontal room between two facts. */
export const FACT_GAP = 12;
const FACT_TYPE: TypeScaleVariant = 'body-2-regular';

// ---------------------------------------------------------------------------

export interface ListingPriceLinesProps {
  lines: ReadonlyArray<ListingPriceLine>;
  size: ListingPartSize;
  color: string;
  secondaryColor: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One line per price: [original, struck, secondary] price semibold [unit]
 * [· secondary, secondary colour]. Each line is one line, truncated.
 */
export function ListingPriceLines({ lines, size, color, secondaryColor, style, testID }: ListingPriceLinesProps) {
  if (lines.length === 0) return null;
  return (
    <View style={style} testID={testID}>
      {lines.map((line, index) => (
        <Text
          key={`${index}-${line.price}`}
          variant={REGULAR[size]}
          numberOfLines={1}
          style={{ color }}
          testID={testID ? `${testID}-${index}` : undefined}
        >
          {line.originalPrice ? (
            <Text variant={REGULAR[size]} style={{ color: secondaryColor, textDecorationLine: 'line-through' }}>
              {line.originalPrice}
            </Text>
          ) : null}
          {line.originalPrice ? ' ' : null}
          <Text variant={SEMIBOLD[size]} style={{ color }}>
            {line.price}
          </Text>
          {line.unit ? ` ${line.unit}` : null}
          {line.secondary ? (
            <Text variant={REGULAR[size]} style={{ color: secondaryColor }}>
              {` · ${line.secondary}`}
            </Text>
          ) : null}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface ListingFactsProps {
  facts: ReadonlyArray<ListingFact>;
  size: ListingPartSize;
  color: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One row of facts, 12 apart, each an optional icon and a label in body-2.
 *
 * The row WRAPS inside a box one line tall and clips: a fact that does not fit
 * moves to a second line nobody sees, so facts drop out whole from the end
 * instead of each being cut to "11…". A single fact wider than the row is the
 * only one that truncates. The card's accessible name carries every fact, so
 * the clipped ones are still announced.
 */
export function ListingFacts({ facts, size, color, style, testID }: ListingFactsProps) {
  if (facts.length === 0) return null;
  const lineHeight = TYPE_SCALE[FACT_TYPE].lineHeight;
  const icon = ICON[size];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: FACT_GAP,
          rowGap: 8,
          height: Math.max(lineHeight, icon),
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      {facts.map((fact, index) => {
        const Icon = fact.icon;
        return (
          <View
            key={`${index}-${fact.label}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 }}
            testID={testID ? `${testID}-${index}` : undefined}
          >
            {Icon ? (
              <View aria-hidden importantForAccessibility="no-hide-descendants">
                <Icon width={icon} height={icon} fill={color} />
              </View>
            ) : null}
            <Text variant={FACT_TYPE} numberOfLines={1} style={{ flexShrink: 1, minWidth: 0, color }}>
              {fact.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface ListingLocationLineProps {
  text: string;
  size: ListingPartSize;
  color: string;
  testID?: string;
}

/** A pin and the address line, one line, truncated. */
export function ListingLocationLine({ text, size, color, testID }: ListingLocationLineProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }} testID={testID}>
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <RiMapPinLine width={ICON[size]} height={ICON[size]} fill={color} />
      </View>
      <Text variant={REGULAR[size]} numberOfLines={1} style={{ flexShrink: 1, minWidth: 0, color }}>
        {text}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface ListingOfferingsProps {
  offerings: ReadonlyArray<Offering>;
  labels?: Partial<Record<Offering, string>>;
  size: OfferingBadgeSize;
  variant: OfferingBadgeVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The offering badges in a wrapping row, 6 apart. Duplicates are drawn once. */
export function ListingOfferings({ offerings, labels, size, variant, style, testID }: ListingOfferingsProps) {
  const unique = uniqueOfferings(offerings);
  if (unique.length === 0) return null;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, style]} testID={testID}>
      {unique.map((offering) => (
        <OfferingBadge
          key={offering}
          offering={offering}
          label={labels?.[offering]}
          size={size}
          variant={variant}
          testID={testID ? `${testID}-${offering}` : undefined}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface ListingStatusPillProps {
  label: string;
  fill: string;
  text: string;
  size: OfferingBadgeSize;
  testID?: string;
}

/** The status pill: the page's reading pair inverted, the badges' geometry. */
export function ListingStatusPill({ label, fill, text, size, testID }: ListingStatusPillProps) {
  const geometry = OFFERING_BADGE_GEOMETRY[size];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        justifyContent: 'center',
        height: geometry.height,
        paddingLeft: geometry.paddingHorizontal,
        paddingRight: geometry.paddingHorizontal,
        borderRadius: borderRadius.full,
        backgroundColor: fill,
      }}
      testID={testID}
    >
      <Text variant={geometry.type} numberOfLines={1} style={{ color: text }}>
        {label}
      </Text>
    </View>
  );
}
