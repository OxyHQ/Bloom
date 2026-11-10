/**
 * The optional boundary for Bloom's native lens menu (Android, API 33+).
 *
 * The overlay, its material and its motion are drawn and animated natively
 * (`android/.../lensmenu`); React only describes rows. The view exists only in
 * a binary built with Bloom's Expo module, so it is resolved lazily and its
 * absence is not an error: the menu keeps its sheet.
 *
 * The `require` is a direct statement of a `try` block so Metro treats `expo`
 * as an optional dependency (see `media-flight/expo-video-module.ts`).
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

export interface LensNativeItem {
  id: string;
  title: string;
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

export interface LensNativeHandle {
  open: (x?: number, y?: number, width?: number, height?: number) => Promise<void>;
  close: () => Promise<void>;
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

/** The trigger's material. */
export interface LensNativeTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
}

export interface LensNativeProps {
  ref?: Ref<LensNativeHandle>;
  items: LensNativeItem[];
  lens?: boolean;
  cornerRadius?: number;
  colorScheme?: 'light' | 'dark' | 'auto';
  config?: LensNativeConfig;
  triggerConfig?: LensNativeTriggerConfig;
  menuWidth?: number;
  alignment?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onItemSelect?: (event: { nativeEvent: { id: string; index: number } }) => void;
  onMenuOpenChange?: (event: { nativeEvent: { open: boolean } }) => void;
}

/** The static lens surface: the engine's material under a resting control, drawn from a shared texture. */
export interface LensSurfaceNativeProps {
  style?: StyleProp<ViewStyle>;
  /** The fill, opaque (`#rrggbb` or `rgb(...)`). */
  tint?: string;
  tintOpacity?: number;
  /** Corner radius in dp; omitted, a capsule. */
  radius?: number;
  dark?: boolean;
  /** The colour of what the surface sits on. */
  page?: string;
}

/** The id of the view that hosts the rows' icons; the native side looks it up. */
export const LENS_ICON_HOST_ID = 'lens-icons';

const MIN_ANDROID_API = 33;

/**
 * A native view of the lens module, or `null` where it cannot run (not Android 13+, or a binary
 * without the module). The `require` is a direct statement of a `try` block so Metro treats `expo`
 * as an optional dependency.
 */
function loadNativeView<P>(name: string): ComponentType<P> | null {
  if (Platform.OS !== 'android' || Number(Platform.Version) < MIN_ANDROID_API) return null;
  if (typeof require !== 'function') return null;
  try {
    const expo = require('expo') as { requireNativeView?: <T>(view: string) => ComponentType<T> };
    return expo.requireNativeView?.<P>(name) ?? null;
  } catch {
    return null;
  }
}

let resolvedMenu: ComponentType<LensNativeProps> | null | undefined;

/** The native lens menu view, or `null` where it cannot run. */
export function getNativeLens(): ComponentType<LensNativeProps> | null {
  if (resolvedMenu === undefined) resolvedMenu = loadNativeView<LensNativeProps>('BloomLensMenu');
  return resolvedMenu;
}

let resolvedSurface: ComponentType<LensSurfaceNativeProps> | null | undefined;

/** The native lens surface view, or `null` where it cannot run. */
export function getNativeLensSurface(): ComponentType<LensSurfaceNativeProps> | null {
  if (resolvedSurface === undefined) {
    resolvedSurface = loadNativeView<LensSurfaceNativeProps>('BloomLensSurface');
  }
  return resolvedSurface;
}
