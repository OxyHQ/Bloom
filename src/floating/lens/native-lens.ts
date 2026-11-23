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
import type { ComponentType, ReactNode } from 'react';
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

/** What a menu inside a base calls: open (out of a press point's box when given) and close. */
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

/** The base's lens: its tint, how far it springs, and how it takes its menu back. */
export interface LensTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
  /** How far the press and the drag deform the lens, a multiplier of the engine's own (1). */
  jelly?: number;
}

/** A menu as a base opens it. */
export interface LensMenu {
  rows: readonly LensRow[];
  config?: LensMenuConfig;
  fontFamily?: string;
  onOpenChange?: (open: boolean) => void;
  onClosed?: () => void;
}

export interface Lens {
  /** The one lens base of Bloom's controls (the upstream app's lens trigger). */
  LensBase: ComponentType<{
    lens?: boolean;
    colorScheme?: 'light' | 'dark';
    cornerRadius?: number;
    config?: LensTriggerConfig;
    restBackdrop?: string;
    /** The base is one menu's trigger: a tap opens it natively, with no round trip to JS. */
    openOnTap?: boolean;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;
  useInLensBase: () => boolean;
  useLensBaseMenu: (menu: LensMenu | null) => LensHandle | null;
}

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

const NO_BASE = () => false;
const NO_BASE_MENU = () => null;

/** Whether a view is inside a lens base: it then draws no lens of its own. */
export function useInLensBase(): boolean {
  return (getNativeLens()?.useInLensBase ?? NO_BASE)();
}

/** A menu inside the nearest lens base (see `@oxy.so/bloom-lens`); `null` outside one. */
export function useLensBaseMenu(menu: LensMenu | null): LensHandle | null {
  return (getNativeLens()?.useLensBaseMenu ?? NO_BASE_MENU)(menu);
}
