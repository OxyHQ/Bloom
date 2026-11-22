/**
 * iOS: a glass group is UIKit's glass container (`UIGlassContainerEffect`,
 * through `expo-glass-effect`'s `GlassContainer`, iOS 26) around the group's
 * `GlassView`s: they share one sampling of what is behind them, and those
 * closer than `blend` merge. Without Liquid Glass the group is a plain view.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import { type ComponentType, createElement, type ReactNode, useId } from 'react';
import type { ViewProps } from 'react-native';
import { useTheme } from '@oxy.so/bloom/theme';

import { GLASS } from '../generated/spec.generated';
import type { GlassValue } from '../glass';
import { lastOf } from '../controls/draw';
import type { IconProps, Node, Press, StackProps } from '../node';
import { resolveSpace, type SpaceToken } from '../tokens';
import { sfSymbolOf } from './sf-symbol';
import { nodesOf } from './values';
import type {
  GlassGroupHostProps,
  PlatformGlassGroup,
  SystemGlassGroup,
  SystemGlassGroupInput,
} from './glass-group-host.types';

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

/**
 * A group of glass icon buttons as SwiftUI's own glass (`@expo/ui`): a
 * `GlassEffectContainer` around SwiftUI buttons, each with `glassEffect` and
 * `glassEffectId` in one `Namespace`, so a button that arrives grows out of
 * its neighbour and one that leaves goes back into it (Apple's
 * `glassEffectID`), animated by `animation` on the group. Drawn only when
 * the group is one stack of such buttons (a glyph with an SF Symbol, a name,
 * `.glass()` and `.glassID()`); any other group is UIKit's container
 * around Bloom's views (above).
 *
 * NOT VERIFIED: written against `@expo/ui`'s SwiftUI API without an iOS build.
 */
interface SwiftUI {
  Host: ComponentType<{
    matchContents?: boolean;
    colorScheme?: 'light' | 'dark';
    children?: ReactNode;
  }>;
  GlassEffectContainer: ComponentType<{
    spacing?: number;
    modifiers?: unknown[];
    children?: ReactNode;
  }>;
  Namespace: ComponentType<{ id: string; children?: ReactNode }>;
  HStack: ComponentType<{ spacing?: number; children?: ReactNode }>;
  VStack: ComponentType<{ spacing?: number; children?: ReactNode }>;
  Button: ComponentType<{
    systemImage?: string;
    label?: string;
    onPress?: () => void;
    modifiers?: unknown[];
  }>;
}
interface SwiftModifiers {
  glassEffect: (options: {
    glass: { variant: 'regular' | 'clear'; interactive?: boolean };
  }) => unknown;
  glassEffectId: (id: string, namespaceId: string) => unknown;
  labelStyle: (style: 'iconOnly') => unknown;
  animation: (animation: unknown, value: unknown) => unknown;
  Animation: { spring: (options?: object) => unknown };
}

let swift: { ui: SwiftUI; modifiers: SwiftModifiers } | null | undefined;

function loadSwiftUI() {
  if (swift !== undefined) return swift;
  swift = null;
  try {
    const ui = require('@expo/ui/swift-ui') as SwiftUI;
    const modifiers = require('@expo/ui/swift-ui/modifiers') as SwiftModifiers;
    const found = ui as Partial<SwiftUI>;
    swift =
      found.GlassEffectContainer &&
      found.Namespace &&
      (modifiers as Partial<SwiftModifiers>).glassEffectId
        ? { ui, modifiers }
        : null;
  } catch {
    swift = null;
  }
  return swift;
}

interface SwiftItem {
  id: string;
  symbol: string;
  label: string;
  glass: GlassValue;
  onPress: Press | undefined;
}

/** A button the system can draw: one glyph with an SF Symbol, a name, a glass and its identity. */
function swiftItem(button: Node): SwiftItem | null {
  if (button.kind !== 'button') return null;
  const [glyph, ...rest] = nodesOf(button.children);
  if (glyph?.kind !== 'icon' || rest.length > 0) return null;
  const symbol = sfSymbolOf((glyph.props as IconProps).icon);
  const id = lastOf(button, 'glassID')?.id;
  const glass = lastOf(button, 'glass')?.value;
  const label = lastOf(button, 'label')?.value;
  if (
    symbol === undefined ||
    id === undefined ||
    glass === undefined ||
    !glass.drawn ||
    label === undefined
  )
    return null;
  return {
    id,
    symbol,
    label,
    glass,
    onPress: lastOf(button, 'onPress')?.value as Press | undefined,
  };
}

function SwiftGlassGroup({
  items,
  axis,
  gap,
  blend,
  press,
}: {
  items: readonly SwiftItem[];
  axis: StackProps['axis'];
  gap: number | undefined;
  blend: number | undefined;
  press: SystemGlassGroupInput['press'];
}) {
  const { ui, modifiers } = loadSwiftUI() as NonNullable<typeof swift>;
  const theme = useTheme();
  const namespace = useId();
  const Stack = axis === 'vertical' ? ui.VStack : ui.HStack;
  return createElement(
    ui.Host,
    { matchContents: true, colorScheme: theme.isDark ? 'dark' : 'light' },
    createElement(
      ui.Namespace,
      { id: namespace },
      createElement(
        ui.GlassEffectContainer,
        {
          spacing: blend,
          // The group's own animation: an item that arrives or leaves morphs.
          modifiers: [
            modifiers.animation(
              modifiers.Animation.spring(),
              items.map((item) => item.id).join('|'),
            ),
          ],
        },
        createElement(
          Stack,
          { spacing: gap },
          ...items.map((item) =>
            createElement(ui.Button, {
              key: item.id,
              systemImage: item.symbol,
              label: item.label,
              onPress: press(item.onPress),
              modifiers: [
                modifiers.labelStyle('iconOnly'),
                modifiers.glassEffect({
                  glass: {
                    variant: GLASS[item.glass.material].iosStyle,
                    interactive: item.glass.interactiveSaid ?? true,
                  },
                }),
                modifiers.glassEffectId(item.id, namespace),
              ],
            }),
          ),
        ),
      ),
    ),
  );
}

export const systemGlassGroup: SystemGlassGroup = ({ node, blend, press }) => {
  if (!loadSwiftUI()) return null;
  const [stack, ...others] = nodesOf(node.children);
  if (stack?.kind !== 'stack' || others.length > 0) return null;
  const axis = (stack.props as StackProps).axis;
  const items: SwiftItem[] = [];
  for (const child of nodesOf(stack.children)) {
    const item = swiftItem(child);
    if (item === null) return null;
    items.push(item);
  }
  const spacing = lastOf(stack, 'spacing');
  return createElement(SwiftGlassGroup, {
    items,
    axis,
    gap: spacing === undefined ? undefined : resolveSpace(spacing.value as SpaceToken),
    blend,
    press,
  });
};
