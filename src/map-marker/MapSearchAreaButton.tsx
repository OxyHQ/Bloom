import React, { memo, useEffect, useMemo } from 'react';
import { Pressable } from 'react-native';

import { CHECKBOX_GLYPH_CSS, CHECKBOX_GLYPH_STYLE_ID, CheckboxGlyph, resolveCheckboxPaint } from '../checkbox/shared';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MAP_MARKER_CSS, MAP_MARKER_STYLE_ID, mapWebData, resolveMapMarkerPaint } from './shared';
import type { MapSearchAreaButtonProps } from './types';

/**
 * The floating pill over a map that ties the results to the visible area.
 *
 *   geometry   40 tall, full pill, 12 left / 16 right, gap 8, 1px hairline, shadow-m
 *   text       body-2-semibold
 *   toggle     a 16px Bloom checkbox box + "Search as I move the map";
 *              `role="checkbox"` with `aria-checked`, the keyboard ring on the box
 *   button     a 16px search icon + "Search this area"; `role="button"`
 *   hover      the surface takes the menu hover fill
 *   disabled   50% opacity, inert
 */

const HEIGHT = 40;

function MapSearchAreaButtonComponent(props: MapSearchAreaButtonProps) {
  const { disabled = false, style, testID } = props;
  const theme = useTheme();
  const paint = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const checkboxPaint = useMemo(() => resolveCheckboxPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  useEffect(() => {
    adoptStyleSheet(MAP_MARKER_STYLE_ID, MAP_MARKER_CSS);
    adoptStyleSheet(CHECKBOX_GLYPH_STYLE_ID, CHECKBOX_GLYPH_CSS);
  }, []);

  const pillStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: HEIGHT,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    borderColor: paint.border,
    backgroundColor: hovered && !disabled ? paint.hoverSurface : paint.surface,
    opacity: disabled ? 0.5 : 1,
    '--bloom-map-ring': paint.ring,
    ...bloomShadowStyle('m'),
  };

  const text = (label: string) => (
    <Text variant="body-2-semibold" numberOfLines={1} style={{ color: paint.label }}>
      {label}
    </Text>
  );

  if (props.variant === 'toggle') {
    const { checked, onCheckedChange } = props;
    const label = props.label ?? 'Search as I move the map';
    return (
      <Pressable
        {...mapWebData({ bloomMapPressable: '', bloomCheckboxFocusable: '' })}
        role="checkbox"
        accessibilityLabel={label}
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onPress={() => onCheckedChange(!checked)}
        onHoverIn={onIn}
        onHoverOut={onOut}
        testID={testID}
        style={[pillStyle, style]}
      >
        <CheckboxGlyph
          size="medium"
          checked={checked}
          indeterminate={false}
          disabled={false}
          highlighted={hovered && !disabled}
          paint={checkboxPaint}
        />
        {text(label)}
      </Pressable>
    );
  }

  const label = props.label ?? 'Search this area';
  return (
    <Pressable
      {...mapWebData({ bloomMapPressable: '' })}
      role="button"
      accessibilityLabel={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={props.onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      testID={testID}
      style={[pillStyle, style]}
    >
      <RiSearchLine width={16} height={16} fill={paint.label} />
      {text(label)}
    </Pressable>
  );
}

export const MapSearchAreaButton = memo(MapSearchAreaButtonComponent);
MapSearchAreaButton.displayName = 'MapSearchAreaButton';
