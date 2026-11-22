/**
 * The lens (`@oxy.so/bloom-lens`): the upstream app's menu component (verbatim) on Bloom's lens
 * engine, and the lens base built from its glass trigger. Android 13+ in a binary built with the
 * module, and OxyOS, which takes the Android files. Bloom's menus and controls on glass adapt to
 * it: they give it their rows, their shape and Bloom's colours, and it draws, presses and opens.
 *
 * It is resolved once and lazily, and its absence is not an error: `getLens()` is `null` and the
 * caller draws Bloom's own material. Bloom resolves the same module in
 * `src/floating/lens/native-lens.ts`; that module is not a public subpath, so the language carries
 * this small binding, as it carries its own stylesheet adoption.
 *
 * The `require`s are direct statements of a `try` block, so Metro treats both modules as optional.
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

/** The lens of the trigger: its tint, its frost, and how it lets the menu out and takes it back. */
export interface LensTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
  /** The engine's frost, a multiplier of its own. */
  blur?: number;
}

/** The panel's tint and the rows' ink; a missing colour keeps the engine's own. */
export interface LensMenuConfig {
  tintColor?: string;
  textColor?: string;
  mutedColor?: string;
  destructiveColor?: string;
  separatorColor?: string;
}

/** What a menu inside a lens base calls. */
export interface LensHandle {
  open: () => void;
  close: () => void;
}

/** A menu as a lens base opens it. */
export interface LensMenu {
  rows: readonly LensRow[];
  config?: LensMenuConfig;
  fontFamily?: string;
  onClosed?: () => void;
}

export interface Lens {
  /** The one glass base (the upstream app's glass trigger): a control on glass, a group, a menu's trigger. */
  LensBase: ComponentType<{
    lens?: boolean;
    colorScheme?: 'light' | 'dark';
    /** The corner radius in points; `undefined` is a capsule. */
    cornerRadius?: number;
    config?: LensTriggerConfig;
    /** The colour the base sits on: its lens is drawn in its place in the page (a base in a scroll). */
    restBackdrop?: string;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;
  useInLensBase: () => boolean;
  /** A menu inside the nearest base; `null` outside one. */
  useLensBaseMenu: (menu: LensMenu | null) => LensHandle | null;
}

const MIN_ANDROID_API = 33;

let resolved: Lens | null | undefined;

/** The lens, or `null` where it cannot run. */
export function getLens(): Lens | null {
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
