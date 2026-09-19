import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ControlSurface } from '../control-surface';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { resolveSurfaceLevel } from '../styles/surface-levels';
import { borderRadius } from '../styles/tokens';
import { resolveChromeGlassColors } from '../theme/glass-colors';
import { useTheme } from '../theme/use-theme';
import { GlassSurface } from './GlassSurface';
import type { GlassIslandProps } from './types';

/**
 * An ISLAND: one translucent, rounded container holding one or more controls
 * that float over content the container does not own.
 *
 * ── WHY THIS EXISTS RATHER THAN A SECOND MATERIAL ───────────────────────────
 *
 * `GlassSurface` is the material — blur, tint, sheen, lit rim — and by its own
 * contract it does NOT own the geometry, the hairline or the shadow: it clips
 * itself, and a shadow drawn on a clipping node is clipped away on iOS. So
 * every caller that wants a floating pane has to assemble the same four things
 * in the same order. Two callers now want exactly that assembly — a
 * `ButtonGroup` in its glass variant, and a page header's back capsule — which
 * is the second real need that justifies writing it once.
 *
 * ── THE FILL IS THE LADDER'S, NOT A LOCAL PALETTE ───────────────────────────
 *
 * The island paints rung 1 of `styles/surface-levels` — byte-for-byte the fill
 * a card and a menu panel already paint — at the CHROME alpha. That is the
 * whole reason it reads as Bloom rather than as a fourth material invented for
 * headers, and it is why a preset change moves islands with everything else.
 *
 * ── WHAT IT TELLS ITS CHILDREN ──────────────────────────────────────────────
 *
 * It mounts a `ControlSurface` with `material: 'glass'`, so a control inside it
 * paints flush — no second fill, no second blur — without the caller writing
 * `variant="glass"` on every one. The nesting rule is the material's, not a
 * preference: a translucent pane inside a translucent pane composites two
 * alphas and two blurs for one pane's worth of depth, and on Android the second
 * blur is not available at all.
 *
 * It does NOT publish a `SurfaceLevelProvider`. A published surface fill is a
 * promise that a descendant can read the pixel it lands on, and the pixel here
 * depends on content Bloom cannot see.
 *
 * ── NO `overflow: hidden` ───────────────────────────────────────────────────
 *
 * Deliberately absent, twice over: `GlassSurface` clips its own layers, and
 * `clipsToBounds` on iOS would clip this box's drop shadow away. Controls
 * inside round their own press highlight instead of relying on the island to
 * cut it.
 */
const GlassIslandComponent: React.FC<GlassIslandProps> = ({
  children,
  radius = borderRadius.full,
  role,
  accessibilityLabel,
  sheen = true,
  style,
  testID,
}) => {
  const theme = useTheme();
  const paint = useMemo(() => {
    const level = resolveSurfaceLevel(theme, 1);
    return { fill: level.background, glass: resolveChromeGlassColors(level.background, level.border, theme.isDark) };
  }, [theme]);

  return (
    <ControlSurface material="glass">
      <View
        role={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          styles.island,
          {
            borderRadius: radius,
            borderWidth: paint.glass.hairlineWidth,
            borderColor: paint.glass.hairline,
          },
          bloomShadowStyle('glass'),
          style,
        ]}
      >
        <GlassSurface
          fill={paint.fill}
          material="chrome"
          radius={radius}
          sheen={sheen}
          testID={testID ? `${testID}-material` : undefined}
        />
        {children}
      </View>
    </ControlSurface>
  );
};

const styles = StyleSheet.create({
  island: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
    position: 'relative',
  },
});

export const GlassIsland = memo(GlassIslandComponent);
GlassIsland.displayName = 'GlassIsland';
