import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { AmenityList } from '../listing-details/AmenityList';
import type { Amenity } from '../listing-details/types';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { resolvePlaceDetailsPaint } from './shared';
import type { PlaceAmenitiesProps } from './types';

/**
 * What the place HAS: step-free entrance, outdoor seating, wifi, cards taken.
 *
 * `layout="list"` IS `listing-details`' `AmenityList`, called with the same
 * items — not a copy of it and not a port of it. A home's amenity block and a
 * place's amenity block are one thing: icon, label, an optional second line,
 * and a struck-through label for the one the place does not have. The only
 * difference was the NOUN, and a noun is not a component. So this part maps
 * `PlaceAmenity` onto `Amenity` and hands over the columns, the `limit`, the
 * "Show all" button and the unavailable treatment.
 *
 * `layout="chips"` is the part a listing page does not have: a wrapping strip
 * of `Chip`s for the top of a sheet, where four attributes have to read in one
 * glance and there is no room for a two-column list. It is the same items at a
 * different density, never a different set.
 *
 *   chip         `large` (28 tall), the amenity's glyph leading, `subtle`
 *   unavailable  the label struck through and the chip dimmed, with "Not
 *                available" in front of its announced name — the same
 *                encoding the list uses, because the two layouts must not
 *                disagree about what "has no wifi" looks like
 */
function PlaceAmenitiesComponent({
  items,
  layout = 'list',
  columns = 'auto',
  limit,
  onShowAll,
  total,
  showAllLabel,
  unavailableLabel = 'Not available',
  accessibilityLabel = 'Amenities',
  style,
  testID,
}: PlaceAmenitiesProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceDetailsPaint(theme, surface), [theme, surface]);

  if (items.length === 0) return null;

  if (layout === 'list') {
    // The identity map is deliberate and typed: `PlaceAmenity` is `Amenity`'s
    // shape, and writing it out is what makes a future divergence a compile
    // error here rather than a silently dropped field.
    const mapped: Amenity[] = items.map(({ label, icon, description, available }) => ({
      label,
      icon,
      description,
      available,
    }));
    return (
      <AmenityList
        items={mapped}
        columns={columns}
        limit={limit}
        onShowAll={onShowAll}
        total={total}
        showAllLabel={showAllLabel}
        unavailableLabel={unavailableLabel}
        style={style}
        testID={testID}
      />
    );
  }

  const shown = limit != null && limit >= 0 ? items.slice(0, limit) : items;

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}
      testID={testID}
    >
      {shown.map(({ label, icon, description: _description, available = true }, index) => (
        <View
          key={`${label}-${index}`}
          role="listitem"
          accessible
          accessibilityLabel={available ? label : `${unavailableLabel}: ${label}`}
          testID={testID ? `${testID}-chip-${index}` : undefined}
        >
          {/*
            The NAME is on the listitem, not on the chip. A non-pressable
            `Chip` is a plain `View`, and on web a `div` carrying an
            `aria-label` and no role is not announced at all — the same
            mechanism `TransitLineBadge` records when it puts `role="img"` on
            its own wrapper.
          */}
          <Chip
            size="large"
            variant="subtle"
            leadingIcon={icon}
            textStyle={
              available
                ? undefined
                : { color: paint.textTertiary, textDecorationLine: 'line-through' }
            }
            style={available ? undefined : { opacity: 0.7 }}
          >
            {label}
          </Chip>
        </View>
      ))}
    </View>
  );
}

export const PlaceAmenities = memo(PlaceAmenitiesComponent);
PlaceAmenities.displayName = 'PlaceAmenities';
