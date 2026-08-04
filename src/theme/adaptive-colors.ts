import { Platform } from 'react-native';
import type { ThemeColors } from './types';

/**
 * `expo-router`'s `Color` proxy is read through a `require()` of a STRING
 * LITERAL as a direct statement of a `try` block — the shape Metro collects as
 * an optional dependency, resolving the real module when installed and writing
 * `null` into the dependency map when it is not, so an app without the optional
 * `expo-router` peer loses the adaptive palette and nothing else.
 *
 * The specifier was previously bound to a local `const` first. That still
 * worked — Metro evaluates the constant — but the literal is what the rule can
 * be stated and checked as, and it does not rest on a constant-folding pass
 * every bundler happens to share. What must never come back is a specifier
 * Metro CANNOT evaluate (a function parameter, a computed value): it collects no
 * dependency and rewrites the call into a thrower, so it resolves nothing on any
 * device.
 *
 * @see connection-status/netinfo.ts — the same boundary, with the full rule.
 */

const c = (v: unknown): string => v as string;

function getAndroidColors(): ThemeColors | null {
  try {
    if (typeof require === 'undefined') return null;
    const { Color } = require('expo-router');
    const d = Color.android.dynamic;
    return {
      background: c(d.surface),
      backgroundSecondary: c(d.surfaceContainerLow),
      backgroundTertiary: c(d.surfaceContainer),
      text: c(d.onSurface),
      textSecondary: c(d.onSurfaceVariant),
      textTertiary: c(d.outline),
      border: c(d.outlineVariant),
      borderLight: c(d.outline),
      primary: c(d.primary),
      primaryForeground: c(d.onPrimary),
      primaryLight: c(d.primaryContainer),
      primaryDark: c(d.onPrimaryContainer),
      secondary: c(d.secondary),
      secondaryForeground: c(d.onSecondary),
      tertiary: c(d.tertiary),
      tertiaryForeground: c(d.onTertiary),
      // Adaptive palettes come from the OS, which has no peak-tone accent to
      // deepen, so the solid-button member is the accent itself.
      secondaryStrong: c(d.secondary),
      secondaryStrongForeground: c(d.onSecondary),
      tertiaryStrong: c(d.tertiary),
      tertiaryStrongForeground: c(d.onTertiary),
      tint: c(d.primary),
      icon: c(d.onSurfaceVariant),
      iconActive: c(d.primary),
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      primarySubtle: c(d.primaryContainer),
      primarySubtleForeground: c(d.onPrimaryContainer),
      negative: '#B91C1C',
      negativeForeground: '#FFFFFF',
      negativeSubtle: c(d.errorContainer),
      negativeSubtleForeground: c(d.onErrorContainer),
      contrast50: c(d.surfaceContainerLow),
      card: c(d.surfaceContainerLow),
      shadow: 'rgba(0, 0, 0, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    };
  } catch {
    return null;
  }
}

function getIOSColors(): ThemeColors | null {
  try {
    if (typeof require === 'undefined') return null;
    const { Color } = require('expo-router');
    const i = Color.ios;
    return {
      background: c(i.systemBackground),
      backgroundSecondary: c(i.secondarySystemBackground),
      backgroundTertiary: c(i.tertiarySystemBackground),
      text: c(i.label),
      textSecondary: c(i.secondaryLabel),
      textTertiary: c(i.tertiaryLabel),
      border: c(i.separator),
      borderLight: c(i.opaqueSeparator),
      primary: c(i.systemBlue),
      primaryForeground: '#FFFFFF',
      primaryLight: c(i.systemGray6),
      primaryDark: c(i.systemBlue),
      secondary: c(i.systemPurple),
      secondaryForeground: '#FFFFFF',
      tertiary: c(i.systemTeal),
      tertiaryForeground: '#FFFFFF',
      secondaryStrong: c(i.systemPurple),
      secondaryStrongForeground: '#FFFFFF',
      tertiaryStrong: c(i.systemTeal),
      tertiaryStrongForeground: '#FFFFFF',
      tint: c(i.systemBlue),
      icon: c(i.secondaryLabel),
      iconActive: c(i.systemBlue),
      success: c(i.systemGreen),
      error: c(i.systemRed),
      warning: c(i.systemOrange),
      info: c(i.systemBlue),
      primarySubtle: c(i.systemGray6),
      primarySubtleForeground: c(i.systemBlue),
      negative: c(i.systemRed),
      negativeForeground: '#FFFFFF',
      negativeSubtle: c(i.systemGray6),
      negativeSubtleForeground: c(i.systemRed),
      contrast50: c(i.systemGray6),
      card: c(i.secondarySystemBackground),
      shadow: 'rgba(0, 0, 0, 0.15)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    };
  } catch {
    return null;
  }
}

export function getAdaptiveColors(): ThemeColors | null {
  if (Platform.OS === 'android') return getAndroidColors();
  if (Platform.OS === 'ios') return getIOSColors();
  return null;
}
