/**
 * iOS: a glass group is UIKit's glass container (`UIGlassContainerEffect`,
 * through `expo-glass-effect`'s `GlassContainer`, iOS 26) around the group's
 * `GlassView`s: they share one sampling of what is behind them, and those
 * closer than `blend` merge. Without Liquid Glass the group is a plain view.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType } from 'react';
import type { ViewProps } from 'react-native';

import type { GlassGroupHostProps, PlatformGlassGroup } from './glass-group-host.types';

interface GlassContainerModule {
  GlassContainer: ComponentType<ViewProps & { spacing?: number }>;
  isLiquidGlassAvailable: () => boolean;
}

let container: GlassContainerModule | null | undefined;

function loadContainer(): GlassContainerModule | null {
  if (container !== undefined) return container;
  container = null;
  try {
    const module = require('expo-glass-effect') as GlassContainerModule;
    container = module.isLiquidGlassAvailable() && module.GlassContainer ? module : null;
  } catch {
    container = null;
  }
  return container;
}

function LiquidGlassGroup({ blend, style, children }: GlassGroupHostProps) {
  const { GlassContainer } = loadContainer() as GlassContainerModule;
  return (
    <GlassContainer spacing={blend} style={style}>
      {children}
    </GlassContainer>
  );
}
LiquidGlassGroup.displayName = 'BloomLiquidGlassGroup';

export function getPlatformGlassGroup(): PlatformGlassGroup {
  return loadContainer() ? LiquidGlassGroup : null;
}
