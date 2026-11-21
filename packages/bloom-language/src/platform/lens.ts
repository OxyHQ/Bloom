/**
 * The lens (`@oxy.so/bloom-lens`): the upstream app's menu component (its `Menu`, `Menu.Trigger`
 * and `Menu.Content`, verbatim) on Bloom's lens engine. Android 13+ in a binary built with the
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
import type { ComponentType, ReactNode, Ref } from 'react';
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
  absorb?: { duration?: number; damping?: number };
}

/** The panel's tint and the rows' ink; a missing colour keeps the engine's own. */
export interface LensMenuConfig {
  tintColor?: string;
  textColor?: string;
  mutedColor?: string;
  destructiveColor?: string;
  separatorColor?: string;
}

export interface LensHandle {
  open: () => void;
  close: () => void;
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
    morph?: boolean;
    /** The corner radius in points; `undefined` is a capsule. */
    cornerRadius?: number;
    config?: LensTriggerConfig;
    /** The trigger opens its menu on a press (its own press layer over the content). */
    openOnPress?: boolean;
    /** The rows arrive only as the menu opens: the view opens itself with them. */
    openWithItems?: boolean;
    /** The menu has finished closing. */
    onMenuClosed?: () => void;
    /**
     * The colour the trigger sits on: the trigger draws its lens at rest in its own place in the
     * view hierarchy, against it (a trigger in a scroll); the overlay draws it only while open.
     */
    restBackdrop?: string;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;
  Content: ComponentType<{
    fontFamily?: string;
    alignment?: 'auto' | 'start' | 'center' | 'end';
    width?: number;
    config?: LensMenuConfig;
    children?: ReactNode;
  }>;
};

export interface Lens {
  Menu: LensMenuComponent;
  lensRows: (rows: readonly LensRow[]) => ReactNode[];
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
