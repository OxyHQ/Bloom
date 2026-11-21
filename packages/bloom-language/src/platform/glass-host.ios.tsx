/**
 * iOS: Liquid Glass (`glassEffect`, through `expo-glass-effect`) on iOS 26,
 * and the system's blur (`UIVisualEffectView`, through `expo-blur`) under the
 * tint before it. Both are optional: without either, a glass view draws
 * Bloom's `Surface`.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme, withAlpha, type ThemeColors } from '@oxy.so/bloom/theme';

import { COLORS, GLASS, GLASS_OPACITY } from '../generated/spec.generated';
import type { GlassHostProps, PlatformGlass } from './glass-host.types';

interface GlassEffectModule {
  GlassView: ComponentType<
    ViewProps & {
      glassEffectStyle?: 'regular' | 'clear';
      tintColor?: string;
      isInteractive?: boolean;
      colorScheme?: 'light' | 'dark';
    }
  >;
  isLiquidGlassAvailable: () => boolean;
}
interface BlurModule {
  BlurView: ComponentType<ViewProps & { intensity?: number; tint?: string }>;
}

let glassEffect: GlassEffectModule | null | undefined;
let blur: BlurModule | null | undefined;

function loadGlassEffect(): GlassEffectModule | null {
  if (glassEffect !== undefined) return glassEffect;
  glassEffect = null;
  try {
    const module = require('expo-glass-effect') as GlassEffectModule;
    glassEffect = module.isLiquidGlassAvailable() ? module : null;
  } catch {
    glassEffect = null;
  }
  return glassEffect;
}

function loadBlur(): BlurModule | null {
  if (blur !== undefined) return blur;
  blur = null;
  try {
    blur = require('expo-blur') as BlurModule;
  } catch {
    blur = null;
  }
  return blur;
}

/** The tint, as a colour with its transparency: a variant's fill while it holds, else the glass's own, else the control's fill. */
function tintOf(
  { glass, fallbackTint, fill }: GlassHostProps,
  colors: ThemeColors,
): string | undefined {
  if (fill !== undefined) {
    const color = colors[COLORS[fill.role].paint] as string;
    return fill.opacity === undefined ? color : withAlpha(color, fill.opacity);
  }
  const role = glass.tintColor ?? fallbackTint;
  if (role === undefined) return undefined;
  const name = glass.tintOpacity ?? (glass.tintColor ? GLASS[glass.material].tintOpacity : null);
  const color = colors[COLORS[role].paint] as string;
  return name === null || name === undefined ? color : withAlpha(color, GLASS_OPACITY[name]);
}

/** A capsule when no radius is given: the radius clamps to half the shorter side. */
const CAPSULE = 9999;

function LiquidGlass(props: GlassHostProps) {
  const { GlassView } = loadGlassEffect() as GlassEffectModule;
  const theme = useTheme();
  return (
    <GlassView
      glassEffectStyle={GLASS[props.glass.material].iosStyle}
      tintColor={tintOf(props, theme.colors)}
      isInteractive={props.interactive}
      colorScheme={theme.isDark ? 'dark' : 'light'}
      style={[props.style, { borderRadius: props.radius ?? CAPSULE }]}
    >
      {props.children}
    </GlassView>
  );
}
LiquidGlass.displayName = 'BloomLiquidGlass';

function BlurGlass(props: GlassHostProps) {
  const { BlurView } = loadBlur() as BlurModule;
  const theme = useTheme();
  const tint = tintOf(props, theme.colors);
  const shape = { borderRadius: props.radius ?? CAPSULE, overflow: 'hidden' as const };
  return (
    <View style={[props.style, shape]}>
      <BlurView
        intensity={100}
        tint={theme.isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {tint ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} pointerEvents="none" />
      ) : null}
      {props.children}
    </View>
  );
}
BlurGlass.displayName = 'BloomBlurGlass';

export function getPlatformGlass(): PlatformGlass {
  if (loadGlassEffect()) return LiquidGlass;
  return loadBlur() ? BlurGlass : null;
}
