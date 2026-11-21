/**
 * The lens engine's native view (`BloomLensMenu`, Kotlin, `packages/bloom-lens`):
 * Android 13+ in a binary built with the `@oxy.so/bloom-lens` module, and
 * OxyOS, which takes the Android files. It draws the owner's glass for the
 * view it holds and, given rows, opens the lens menu from it.
 *
 * The view is resolved once and lazily, and its absence is not an error:
 * `getNativeLens()` is `null` and the caller draws Bloom's own material.
 * Bloom resolves the same view in `src/floating/lens/native-lens.ts`; that
 * module is not a public subpath, so the language carries this small binding,
 * as it carries its own stylesheet adoption.
 *
 * The `require` is a direct statement of a `try` block, so Metro treats `expo`
 * as optional.
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

export interface LensNativeItem {
  id: string;
  title: string;
  subtitle?: string;
  iconSlot?: number;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  separator?: boolean;
  heading?: boolean;
  /** A sub-menu row: its rows (one level). */
  items?: LensNativeItem[];
}

/** The menu panel's material and row ink; a missing colour keeps the engine's own. */
export interface LensNativeConfig {
  tintColor?: string;
  tintOpacity?: number;
  textColor?: string;
  mutedColor?: string;
  destructiveColor?: string;
  separatorColor?: string;
}

/** The glass of the view itself (a control, or a menu's trigger). */
export interface LensNativeTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
  /** The engine's frost, a multiplier of its own. */
  blur?: number;
  /** How the trigger takes its menu back as it closes, in seconds and a damping ratio. */
  absorb?: { duration?: number; damping?: number };
}

/** A trigger on glass takes its menu back over 0.48 s, as the engine's upstream app's does. */
export const LENS_GLASS_TRIGGER_ABSORB = { duration: 0.48 } as const;

export interface LensNativeHandle {
  open: (x?: number, y?: number, width?: number, height?: number) => Promise<void>;
  close: () => Promise<void>;
}

export interface LensNativeProps {
  ref?: Ref<LensNativeHandle>;
  items: LensNativeItem[];
  /** Draw the view's own glass. */
  lens?: boolean;
  /** A trigger without glass: the menu still grows out of its shape (the engine's default). */
  morph?: boolean;
  /** The view's corner radius in points; `undefined` is a capsule. */
  cornerRadius?: number;
  colorScheme?: 'light' | 'dark' | 'auto';
  /** The panel's width in points; `undefined` is the rows' own width. */
  menuWidth?: number;
  /** The rows' face, a family the app registered; `undefined` is the engine's bundled Inter. */
  fontFamily?: string;
  /** Which edge of the trigger the panel hangs from; `auto` follows the side of the screen it is on. */
  alignment?: 'auto' | 'start' | 'center' | 'end';
  config?: LensNativeConfig;
  triggerConfig?: LensNativeTriggerConfig;
  /**
   * The rows arrive only as the menu opens (a `menu()` content): the view opens
   * itself once it has them, and again each time they arrive after being emptied.
   */
  openWithItems?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onItemSelect?: (event: { nativeEvent: { id: string } }) => void;
  /** The menu has finished closing (its motion ended, or another menu took its place). */
  onMenuClosed?: () => void;
}

/** The `nativeID` of the view that holds the rows' icons; the engine draws each slot in its row. */
export const LENS_ICON_HOST_ID = 'lens-icons';

const MIN_ANDROID_API = 33;

let resolved: ComponentType<LensNativeProps> | null | undefined;

/** The lens view, or `null` where it cannot run. */
export function getNativeLens(): ComponentType<LensNativeProps> | null {
  if (resolved !== undefined) return resolved;
  resolved = null;
  if (Platform.OS !== 'android' || Number(Platform.Version) < MIN_ANDROID_API) return resolved;
  if (typeof require !== 'function') return resolved;
  try {
    const expo = require('expo') as {
      requireNativeView?: <P>(name: string) => ComponentType<P>;
    };
    resolved = expo.requireNativeView?.<LensNativeProps>('BloomLensMenu') ?? null;
  } catch {
    resolved = null;
  }
  return resolved;
}
