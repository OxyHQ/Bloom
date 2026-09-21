import React, { memo, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassIsland } from '../glass';
import { MAP_ATTRIBUTION_GEOMETRY } from './constants';
import type { MapAttributionVariant } from './types';

/**
 * The box the small print sits in — the ONE place the two components in this
 * family decide what "legible over any tile" means, so they cannot drift apart.
 *
 * `island` is `GlassIsland` at the 8 rung: a translucent pane with a hairline
 * and a shadow, over content Bloom does not own. It is asked for a SURFACE
 * radius rather than its default capsule, because the small print is a surface
 * and the pill rung belongs to button-like controls. `inline` renders a plain
 * `View` with the same padding, for a strip already inside a surface the app
 * painted — a legend panel, a settings row — where a second pane would be a
 * second card.
 *
 * Internal: not on the barrel. It is the shell, not a component a consumer
 * should mount around something else.
 */
export interface MapAttributionShellProps {
  variant: MapAttributionVariant;
  children?: ReactNode;
  role?: 'group';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function MapAttributionShellComponent({
  variant,
  children,
  role,
  accessibilityLabel,
  style,
  testID,
}: MapAttributionShellProps) {
  const g = MAP_ATTRIBUTION_GEOMETRY;
  const box: ViewStyle = {
    flexDirection: 'column',
    alignSelf: 'flex-start',
    paddingTop: g.paddingVertical,
    paddingBottom: g.paddingVertical,
    paddingLeft: g.paddingHorizontal,
    paddingRight: g.paddingHorizontal,
    gap: g.gap,
  };

  if (variant === 'inline') {
    return (
      <View
        role={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        // No padding at all: `inline` is the words and nothing else, and a pane
        // that kept the island's inset would show as a margin nobody asked for
        // inside the surface the app already painted.
        style={[box, { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }, style]}
      >
        {children}
      </View>
    );
  }

  return (
    <GlassIsland
      radius={g.radius}
      role={role}
      accessibilityLabel={accessibilityLabel}
      style={[box, style]}
      testID={testID}
    >
      {children}
    </GlassIsland>
  );
}

export const MapAttributionShell = memo(MapAttributionShellComponent);
MapAttributionShell.displayName = 'MapAttributionShell';
