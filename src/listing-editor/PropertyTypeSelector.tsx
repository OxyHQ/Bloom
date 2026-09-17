import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArmchairLine } from '../icons/remix/RiArmchairLine';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiBuilding4Line } from '../icons/remix/RiBuilding4Line';
import { RiCommunityLine } from '../icons/remix/RiCommunityLine';
import { RiDoorOpenLine } from '../icons/remix/RiDoorOpenLine';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiHotelBedLine } from '../icons/remix/RiHotelBedLine';
import { RiMoreLine } from '../icons/remix/RiMoreLine';
import { RiStackLine } from '../icons/remix/RiStackLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CheckCircle,
  resolveSelectionPaint,
  SELECTION_CARD_RADIUS,
  useSelectionCardCss,
  type SelectionPaint,
} from './SelectionCard';
import type { PropertyType, PropertyTypeOption, PropertyTypeSelectorProps } from './types';

/**
 * The kind of home, picked from large icon tiles. Single select.
 *
 *   grid      2 columns below 400 wide, 3 below 640, 4 from there (or
 *             `columns`); 12 apart
 *   tile      min 112 tall, radius 16, p 16, 1px neutral-200 border (dark
 *             neutral-700), the card colour as fill in light; the 28 icon top-left, the label (body-semibold)
 *             and an optional description (caption-1-regular, text-secondary)
 *             at the bottom
 *   hover     border neutral-400 (dark neutral-500) and a neutral-50 wash
 *   selected  a 2px text-primary border, the check circle top-right
 *   disabled  50% opacity
 *
 * Accessibility: a `radiogroup` (named by `accessibilityLabel`) of `radio`s
 * with `aria-checked`, each named by its label.
 */

export const DEFAULT_PROPERTY_TYPES: ReadonlyArray<PropertyTypeOption<PropertyType>> = [
  { value: 'apartment', label: 'Apartment', icon: RiBuilding2Line },
  { value: 'house', label: 'House', icon: RiHome4Line },
  { value: 'room', label: 'Room', icon: RiDoorOpenLine },
  { value: 'studio', label: 'Studio', icon: RiArmchairLine },
  { value: 'duplex', label: 'Duplex', icon: RiStackLine },
  { value: 'penthouse', label: 'Penthouse', icon: RiBuilding4Line },
  { value: 'coliving', label: 'Coliving', icon: RiCommunityLine },
  { value: 'hostel', label: 'Hostel', icon: RiHotelBedLine },
  { value: 'other', label: 'Other', icon: RiMoreLine },
];

export function propertyTypeColumns(width: number): number {
  if (width < 400) return 2;
  if (width < 640) return 3;
  return 4;
}

export function PropertyTypeSelector<T extends string = PropertyType>({
  value,
  onValueChange,
  options,
  columns: columnsProp,
  accessibilityLabel = 'Property type',
  error,
  disabled = false,
  style,
  testID,
}: PropertyTypeSelectorProps<T>) {
  const theme = useTheme();
  useSelectionCardCss();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const [width, setWidth] = useState(0);
  const columns = columnsProp ?? propertyTypeColumns(width);
  const gap = 12;
  const tileWidth = width > 0 ? Math.floor((width - gap * (columns - 1)) / columns) : 0;
  const list = (options ?? DEFAULT_PROPERTY_TYPES) as ReadonlyArray<PropertyTypeOption<T>>;

  return (
    <View testID={testID} style={[{ gap: 8 }, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View
        role="radiogroup"
        accessibilityLabel={accessibilityLabel}
        aria-disabled={disabled || undefined}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}
      >
        {tileWidth > 0
          ? list.map((option) => (
              <PropertyTile
                key={option.value}
                option={option}
                selected={value === option.value}
                onPress={() => onValueChange(option.value)}
                width={tileWidth}
                paint={paint}
                disabled={disabled || !!option.disabled}
                testID={testID ? `${testID}-${option.value}` : undefined}
              />
            ))
          : null}
      </View>
      {error ? (
        <Text variant="body-2-regular" accessibilityLiveRegion="polite" style={{ color: paint.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

PropertyTypeSelector.displayName = 'PropertyTypeSelector';

function PropertyTile<T extends string>({
  option,
  selected,
  onPress,
  width,
  paint,
  disabled,
  testID,
}: {
  option: PropertyTypeOption<T>;
  selected: boolean;
  onPress: () => void;
  width: number;
  paint: SelectionPaint;
  disabled: boolean;
  testID?: string;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = !disabled && (hovered || pressed);
  const Icon = option.icon;
  const borderWidth = selected ? 2 : 1;
  const inset = 16 - (borderWidth - 1);

  const tileStyle: WebCssStyle = {
    width,
    minHeight: 112,
    borderRadius: SELECTION_CARD_RADIUS,
    borderWidth,
    borderColor: selected ? paint.borderSelected : highlighted ? paint.borderHover : paint.border,
    backgroundColor: highlighted && !selected ? paint.wash : paint.fill,
    paddingTop: inset,
    paddingBottom: inset,
    paddingLeft: inset,
    paddingRight: inset,
    justifyContent: 'space-between',
    gap: 16,
    opacity: disabled ? 0.5 : 1,
    '--bloom-selection-card-ring': paint.ring,
  };

  return (
    <Pressable
      role="radio"
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
      aria-checked={selected}
      accessibilityState={{ checked: selected, disabled }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={selected ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...webDataSet({ bloomSelectionCardHead: '' })}
      testID={testID}
      style={tileStyle}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon width={28} height={28} fill={paint.icon} />
        {selected ? <CheckCircle selected paint={paint} size={20} /> : null}
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="body-semibold" numberOfLines={1} style={{ color: paint.text }}>
          {option.label}
        </Text>
        {option.description && width >= 140 ? (
          <Text variant="caption-1-regular" numberOfLines={2} style={{ color: paint.textSecondary }}>
            {option.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
