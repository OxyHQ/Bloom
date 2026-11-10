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

/** The id of the view that hosts the rows' icons; the native side looks it up. */
export const LENS_ICON_HOST_ID = 'lens-icons';

const MIN_ANDROID_API = 33;

let resolved: ComponentType<LensNativeProps> | null | undefined;

/** The native lens menu view, or `null` where it cannot run. */
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
