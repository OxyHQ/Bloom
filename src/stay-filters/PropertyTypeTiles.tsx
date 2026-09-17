import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { FOCUS_RING_OFFSET_COLOR, webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PROPERTY_TYPE_OPTIONS, relabelOptions } from './constants';
import type { FilterIconComponent, PropertyType, PropertyTypeOption, PropertyTypeTilesProps } from './types';

/**
 * A multi-select grid of icon tiles, one per property type. Internal: the
 * filters' `PropertyTypeFilter` and the search panel's `PropertyTypePicker`
 * both draw it, at different tile sizes.
 *
 *   tile       radius 12, a 24px icon over a body-2-medium label, 8 apart
 *   rest       1px border neutral-200 (dark neutral-700), transparent
 *   hover      border text-primary (web pointer)
 *   press      fill neutral-100 (dark neutral-800)
 *   selected   2px border text-primary on a neutral-100 (dark neutral-800)
 *              tint — the inner padding gives back the extra pixel, so a
 *              selected tile never moves its content
 *   grid       8 apart; rows of `columns` tiles sharing the width equally, the
 *              last row padded with empty cells so every tile keeps one width
 *
 * A `group`; each tile a toggle `button` with `aria-pressed` (web) and
 * `accessibilityState.selected` (native).
 */

export type TileSize = 'medium' | 'large';

const TILE_GEOMETRY: Record<TileSize, { minWidth: number; minHeight: number; padding: number }> = {
  medium: { minWidth: 96, minHeight: 92, padding: 12 },
  large: { minWidth: 120, minHeight: 100, padding: 16 },
};

export const PROPERTY_TILE_RADIUS = 12;
const GAP = 8;
const ICON_SIZE = 24;

const STYLE_ID = 'bloom-property-type-tile-web-css';
const SELECTOR = '[data-bloom-property-tile]';
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
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-property-tile-ring, currentColor);
}
@media (prefers-reduced-motion: reduce) {
  ${SELECTOR} { transition: none; }
}
`;

/** How many tiles fit a width: at least 2, at most 4. Pure; exported for the tests. */
export function tileColumns(width: number, minTileWidth: number): number {
  if (width <= 0) return 4;
  return Math.max(2, Math.min(4, Math.floor((width + GAP) / (minTileWidth + GAP))));
}

interface TileProps {
  label: string;
  icon: FilterIconComponent;
  selected: boolean;
  disabled: boolean;
  size: TileSize;
  onPress: () => void;
  testID?: string;
}

function Tile({ label, icon: Icon, selected, disabled, size, onPress, testID }: TileProps) {
  const theme = useTheme();
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hover = useInteractionState();
  const press = useInteractionState();
  const dark = theme.isDark;
  const text = theme.colors.text;
  const tint = dark ? neutral[800] : neutral[100];
  const active = !disabled;
  const border = selected ? 2 : 1;
  const { minHeight, padding } = TILE_GEOMETRY[size];
  const inset = padding - (border - 1);

  const style: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    minHeight,
    borderRadius: PROPERTY_TILE_RADIUS,
    borderWidth: border,
    borderColor: selected || (hover.state && active) ? text : dark ? neutral[700] : neutral[200],
    backgroundColor: selected || (press.state && active) ? tint : 'transparent',
    paddingTop: inset,
    paddingBottom: inset,
    paddingLeft: inset,
    paddingRight: inset,
    justifyContent: 'space-between',
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    '--bloom-property-tile-ring': accent[500],
  };

  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={hover.onIn}
      onHoverOut={hover.onOut}
      onPressIn={press.onIn}
      onPressOut={press.onOut}
      testID={testID}
      {...webDataSet({ bloomPropertyTile: selected ? 'selected' : '' })}
      style={style}
    >
      <Icon width={ICON_SIZE} height={ICON_SIZE} fill={text} />
      <Text variant="body-2-medium" numberOfLines={2} style={{ color: text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface PropertyTypeTilesInternalProps<T extends string> extends PropertyTypeTilesProps<T> {
  size: TileSize;
}

export function PropertyTypeTiles<T extends string = PropertyType>({
  value,
  onValueChange,
  options,
  labels,
  columns,
  accessibilityLabel = 'Property type',
  disabled = false,
  size,
  style,
  testID,
}: PropertyTypeTilesInternalProps<T>) {
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  const [width, setWidth] = useState(0);
  const items = relabelOptions<T, PropertyTypeOption<T>>(
    options ?? (PROPERTY_TYPE_OPTIONS as unknown as readonly PropertyTypeOption<T>[]),
    labels,
  );
  const perRow = columns ?? tileColumns(width, TILE_GEOMETRY[size].minWidth);
  const selected = new Set<T>(value);

  const toggle = (item: T) => {
    const next = new Set(selected);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    onValueChange(items.map((o) => o.value).filter((v) => next.has(v)));
  };

  const rows: PropertyTypeOption<T>[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel}
      onLayout={columns == null ? (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) : undefined}
      style={[{ gap: GAP }, style]}
    >
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: GAP }}>
          {row.map((option) => (
            <Tile
              key={option.value}
              label={option.label}
              icon={option.icon}
              size={size}
              selected={selected.has(option.value)}
              disabled={disabled}
              onPress={() => toggle(option.value)}
              testID={testID ? `${testID}-${option.value}` : undefined}
            />
          ))}
          {Array.from({ length: perRow - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={{ flex: 1, minWidth: 0 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
