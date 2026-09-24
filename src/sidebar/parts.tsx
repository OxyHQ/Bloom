import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Avatar } from '../avatar';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import type { SidebarPalette } from './palette';
import type { SidebarAvatar } from './types';

export const IS_WEB = Platform.OS === 'web';

/** The `duration-300 ease-in-out` morph. */
export const MORPH_MS = 300;

// ---------------------------------------------------------------------------
//  Collapse progress, shared with every label slot: 0 expanded, 1 collapsed.
// ---------------------------------------------------------------------------

const CollapseContext = createContext<SharedValue<number> | null>(null);
export const CollapseProvider = CollapseContext.Provider;

/** Inside a `Sidebar`, rows stretch with the morphing panel instead of snapping to 36px. */
export function useInSidebar(): boolean {
  return useContext(CollapseContext) !== null;
}

/** Share the panel's clock; standalone controls use the same reversible timing. */
export function useSidebarCollapseProgress(collapsed: boolean): SharedValue<number> {
  const context = useContext(CollapseContext);
  const reducedMotion = useReducedMotion();
  const local = useSharedValue(collapsed ? 1 : 0);
  useEffect(() => {
    if (!context) {
      local.value = reducedMotion ? Number(collapsed) : withTiming(Number(collapsed), {
        duration: MORPH_MS, easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
  }, [collapsed, context, local, reducedMotion]);
  return context ?? local;
}

/**
 * A `Collapsible` slot: max-width + opacity + blur(3px) collapse to
 * nothing while the icon beside it stays pinned. The natural width is measured
 * on an unshrinking inner box, so the clamp can animate from it.
 *
 * Outside a sidebar (no progress in context) it follows `collapsed` directly.
 */
export function Collapsible({
  collapsed,
  children,
  style,
}: {
  collapsed: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSidebarCollapseProgress(collapsed);
  const natural = useSharedValue(0);
  const animated = useAnimatedStyle(() => {
    const p = progress.value;
    const base: ViewStyle = {
      opacity: 1 - p,
      maxWidth: p >= 1 ? 0 : p <= 0 || natural.value === 0 ? undefined : natural.value * (1 - p),
    };
    if (IS_WEB) (base as { filter?: string }).filter = p > 0 ? `blur(${3 * p}px)` : 'none';
    return base;
  }, [progress, natural]);

  return (
    <Animated.View
      style={[{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden' }, style, animated]}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
        onLayout={(event: LayoutChangeEvent) => {
          natural.value = event.nativeEvent.layout.width;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Web focus ring. Rows are react-native-web Pressables, so the rules hang off
//  a `dataSet` attribute (a class never reaches the DOM).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-sidebar-web-css';
const SEL = '[data-bloom-sidebar]';
const WEB_CSS = `
${SEL} {
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition: background-color 300ms ease-in-out, border-color 150ms ease, box-shadow 150ms ease;
}
${SEL}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-sidebar-ring);
}
${SEL}[data-bloom-sidebar="offset"]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-sidebar-ring-offset), 0 0 0 4px var(--bloom-sidebar-ring);
}
${SEL}[data-bloom-sidebar="inset"]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-sidebar-ring);
}
[data-bloom-sidebar-scroll] { scrollbar-width: none; }
[data-bloom-sidebar-scroll]::-webkit-scrollbar { display: none; }
`;

export function useSidebarWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);
}

export function webHook(kind: 'ring' | 'offset' | 'inset' = 'ring'): Record<string, unknown> {
  return IS_WEB ? { dataSet: { bloomSidebar: kind } } : {};
}

// ---------------------------------------------------------------------------
//  Painting helpers
// ---------------------------------------------------------------------------

let gradientIds = 0;

/** A top-to-bottom gradient fill (opaque stops — react-native-svg drops alpha). */
export function GradientFill({ from, to, radius }: { from: string; to: string; radius: number }) {
  const id = useMemo(() => `bloom-sidebar-gradient${gradientIds++}`, []);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const AVATAR_TYPE = {
  // Avatar `xs`: 20px, 10/15 semibold.
  xs: { size: 20, fontSize: 10, lineHeight: 15 },
  // `md`: 32px, `text-headline-semibold` 16/22.
  md: { size: 32, fontSize: 16, lineHeight: 22 },
} as const;

/** An image, or initials on a tinted disc. */
export function SidebarAvatarView({
  avatar,
  size,
  palette,
  background,
}: {
  avatar?: SidebarAvatar;
  size: 'xs' | 'md';
  palette: SidebarPalette;
  background?: string;
}) {
  const geometry = AVATAR_TYPE[size];
  if (avatar?.source) {
    return <Avatar source={avatar.source} size={geometry.size} style={{ flexShrink: 0 }} />;
  }
  const tint = palette.avatar[avatar?.color ?? 'neutral'];
  return (
    <View
      style={{
        width: geometry.size,
        height: geometry.size,
        flexShrink: 0,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: background ?? tint.background,
      }}
    >
      <Text
        style={{
          fontSize: geometry.fontSize,
          lineHeight: geometry.lineHeight,
          fontWeight: '600',
          color: tint.foreground,
          textAlign: 'center',
        }}
      >
        {avatar?.initials ?? ''}
      </Text>
    </View>
  );
}

/** 16×16, 2px rounded stroke. */
export function ChevronDownSmall({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 7L7.29289 10.2929C7.68342 10.6834 8.31658 10.6834 8.70711 10.2929L12 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 16×16, 1.5px rounded strokes. */
export function ChevronUpDownSmall({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G transform="translate(4.25 2.56)">
        <Path
          d="M0.75 7.43934L3.21967 9.90901C3.51256 10.2019 3.98744 10.2019 4.28033 9.90901L6.75 7.43934"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M0.75 3.43934L3.21967 0.96967C3.51256 0.676777 3.98744 0.676777 4.28033 0.96967L6.75 3.43934"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

/**
 * The width both sidebar menus give their popover: `w-[265px]` — the only
 * thing these menus say differently from the popover panel itself. Radius,
 * border, surface, `p-2.5` and `shadow-dropdown` are `Popover`'s own defaults
 * (`popover/surface.ts`), which is why this stopped being a function of the
 * palette: it took one and ignored it, and both call sites kept passing one.
 */
export const SIDEBAR_MENU_PANEL: ViewStyle = { width: 265 };

/** Full-bleed menu divider: `-mx-2.5 h-px bg-border-button-default`. */
export function MenuDivider({ palette, spacing }: { palette: SidebarPalette; spacing: number }) {
  return (
    <View
      style={{
        height: 1,
        marginLeft: -10,
        marginRight: -10,
        marginTop: spacing,
        marginBottom: spacing,
        backgroundColor: palette.menu.border,
      }}
    />
  );
}
