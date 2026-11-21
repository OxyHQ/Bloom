/**
 * The optional boundary for Bloom's lens (Android, API 33+): `@oxy.so/bloom-lens`, the upstream
 * app's menu component (its `Menu`, `Menu.Trigger` and `Menu.Content`, verbatim) on the lens
 * engine. Bloom's menus and lens controls adapt to it: they give it their rows, their shape and
 * Bloom's colours, and it draws, presses and opens.
 *
 * The module exists only in a binary built with it, so it is resolved lazily and its absence is
 * not an error: the menu keeps its sheet and a control its shared paint.
 *
 * The `require`s are direct statements of a `try` block so Metro treats `expo` and the module as
 * optional dependencies (see `media-flight/expo-video-module.ts`).
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

/** A row as the lens menu takes it (`lensRows` turns them into the menu's own parts). */
export type LensRow =
  | {
      kind: 'item';
      id: string;
      title: string;
      subtitle?: string;
      /** The row's glyph, a view. */
      icon?: ReactNode;
      checked?: boolean;
      destructive?: boolean;
      disabled?: boolean;
      keepOpen?: boolean;
      onSelect?: () => void;
    }
  | { kind: 'submenu'; id: string; title: string; rows: readonly LensRow[] }
  | { kind: 'heading'; id: string; title: string }
  | { kind: 'separator'; id: string };

/** The menu's handle: open (from a point's box, or the trigger) and close. */
export interface LensHandle {
  open: (from?: { x: number; y: number; width: number; height: number }) => void;
  close: () => void;
}

/** The panel's tint and the rows' ink; a missing colour keeps the engine's own. */
export interface LensMenuConfig {
  tintColor?: string;
  textColor?: string;
  mutedColor?: string;
  destructiveColor?: string;
  separatorColor?: string;
}

/** The trigger's lens: its tint, and how it takes its menu back. */
export interface LensTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
  /** How far the press and the drag deform the lens, a multiplier of the engine's own (1). */
  jelly?: number;
  absorb?: { duration?: number; damping?: number };
}

type LensMenuComponent = ComponentType<{
  ref?: Ref<LensHandle>;
  colorScheme?: 'light' | 'dark' | 'auto';
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}> & {
  Trigger: ComponentType<{
    /** Draw the trigger's lens: its base, which the menu grows out of. */
    lens?: boolean;
    cornerRadius?: number;
    config?: LensTriggerConfig;
    /** The trigger opens its menu on a press (its own press layer over the content). */
    openOnPress?: boolean;
    /** The rows arrive only as the menu opens: the view opens itself with them. */
    openWithItems?: boolean;
    /** The menu has finished closing. */
    onMenuClosed?: () => void;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;
  Content: ComponentType<{
    fontFamily?: string;
    config?: LensMenuConfig;
    children?: ReactNode;
  }>;
};

export interface Lens {
  Menu: LensMenuComponent;
  lensRows: (rows: readonly LensRow[]) => ReactNode[];
}

/** A lens trigger takes its menu back over 0.48 s, as the upstream app's trigger does. */
export const LENS_TRIGGER_CONFIG = { absorb: { duration: 0.48 } } as const;

const MIN_ANDROID_API = 33;

let resolved: Lens | null | undefined;

/** The lens, or `null` where it cannot run. */
export function getNativeLens(): Lens | null {
  if (resolved !== undefined) return resolved;
  resolved = null;
  if (Platform.OS !== 'android' || Number(Platform.Version) < MIN_ANDROID_API) return resolved;
  if (typeof require !== 'function') return resolved;
  try {
    const expo = require('expo') as {
      requireOptionalNativeModule?: (name: string) => unknown;
    };
    if (!expo.requireOptionalNativeModule?.('BloomLensMenu')) return resolved;
    resolved = require('@oxy.so/bloom-lens') as Lens;
  } catch {
    resolved = null;
  }
  return resolved;
}
