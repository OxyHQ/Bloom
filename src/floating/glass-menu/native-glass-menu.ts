/**
 * The optional boundary for Bloom's native glass menu (Android, API 33+).
 *
 * The overlay, its material and its motion are drawn and animated natively
 * (`android/.../glassmenu`); React only describes rows. The view exists only in
 * a binary built with Bloom's Expo module, so it is resolved lazily and its
 * absence is not an error: the menu keeps its sheet.
 *
 * The `require` is a direct statement of a `try` block so Metro treats `expo`
 * as an optional dependency (see `media-flight/expo-video-module.ts`).
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

export interface GlassMenuNativeItem {
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
  items?: GlassMenuNativeItem[];
}

export interface GlassMenuNativeHandle {
  open: (x?: number, y?: number, width?: number, height?: number) => Promise<void>;
  close: () => Promise<void>;
}

/** The menu panel's material and row ink; a missing colour keeps the engine's own. */
export interface GlassMenuNativeConfig {
  tintColor?: string;
  tintOpacity?: number;
  textColor?: string;
  mutedColor?: string;
  destructiveColor?: string;
  separatorColor?: string;
}

/** The trigger's material. */
export interface GlassMenuNativeTriggerConfig {
  tintColor?: string;
  tintOpacity?: number;
}

export interface GlassMenuNativeProps {
  ref?: Ref<GlassMenuNativeHandle>;
  items: GlassMenuNativeItem[];
  glass?: boolean;
  cornerRadius?: number;
  colorScheme?: 'light' | 'dark' | 'auto';
  config?: GlassMenuNativeConfig;
  triggerConfig?: GlassMenuNativeTriggerConfig;
  menuWidth?: number;
  alignment?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onItemSelect?: (event: { nativeEvent: { id: string; index: number } }) => void;
  onMenuOpenChange?: (event: { nativeEvent: { open: boolean } }) => void;
}

/** The id of the view that hosts the rows' icons; the native side looks it up. */
export const GLASS_MENU_ICON_HOST_ID = 'glass-menu-icons';

const MIN_ANDROID_API = 33;

let resolved: ComponentType<GlassMenuNativeProps> | null | undefined;

/** The native glass menu view, or `null` where it cannot run. */
export function getNativeGlassMenu(): ComponentType<GlassMenuNativeProps> | null {
  if (resolved !== undefined) return resolved;
  resolved = null;
  if (Platform.OS !== 'android' || Number(Platform.Version) < MIN_ANDROID_API) return resolved;
  if (typeof require !== 'function') return resolved;
  try {
    const expo = require('expo') as {
      requireNativeView?: <P>(name: string) => ComponentType<P>;
    };
    resolved = expo.requireNativeView?.<GlassMenuNativeProps>('BloomGlassMenu') ?? null;
  } catch {
    resolved = null;
  }
  return resolved;
}
