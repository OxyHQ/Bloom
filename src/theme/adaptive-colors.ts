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

/**
 * The subset of `ThemeColors` a platform's adaptive palette can actually answer.
 *
 * Material You and iOS dynamic ship a brand family and an error family and
 * NOTHING for success/warning/info — which is why the four status fills below
 * are frozen hexes rather than platform reads. The tinted status members have no
 * platform counterpart at all, so they are deliberately absent here and come
 * from the preset-derived palette underneath (`buildTheme` overlays this on it).
 * That keeps the four `*Subtle`/`*SubtleForeground` pairs coming from ONE source
 * — the colour policy, whose pairs are gated at AA — instead of four hand-picked
 * tints that would only be legible by luck.
 *
 * Consequence for anyone extending this file: adding one of those keys to a
 * branch below is a type error, on purpose. Answering it needs a real platform
 * role, not a neutral grey.
 */
export type AdaptiveColors = Omit<
  ThemeColors,
  | 'successSubtle'
  | 'successSubtleForeground'
  | 'errorSubtle'
  | 'errorSubtleForeground'
  | 'warningSubtle'
  | 'warningSubtleForeground'
  | 'infoSubtle'
  | 'infoSubtleForeground'
>;

const c = (v: unknown): string => v as string;

let hasWarned = false;

/**
 * SAY SO. This boundary degraded in complete silence, which is the worst of the
 * six: an app simply gets the preset palette instead of the platform's, and
 * nothing anywhere says the platform read failed.
 *
 * It is only reachable on Android and iOS — `getAdaptiveColors` returns `null`
 * on web before touching `require` — so an ESM bundle never gets here. That is
 * an argument for warning, not against it: a failure that cannot happen in the
 * environment you test in is exactly the one that goes unnoticed when it does.
 */
function warnAdaptiveColorsUnavailable(reason: string): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[Bloom] The adaptive palette fell back to the preset one: `expo-router`’s ' +
      '`Color` proxy could not be read, so platform colours (Material You, iOS ' +
      'dynamic) are not in use. Install the optional peer ' +
      '(`npx expo install expo-router`) if you want them. ' +
      `Reason: ${reason}`,
  );
}

function getAndroidColors(): AdaptiveColors | null {
  try {
    if (typeof require === 'undefined') {
      warnAdaptiveColorsUnavailable('this bundle has no CommonJS `require`');
      return null;
    }
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
  } catch (error) {
    warnAdaptiveColorsUnavailable(error instanceof Error ? error.message : String(error));
    return null;
  }
}

function getIOSColors(): AdaptiveColors | null {
  try {
    if (typeof require === 'undefined') {
      warnAdaptiveColorsUnavailable('this bundle has no CommonJS `require`');
      return null;
    }
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
  } catch (error) {
    warnAdaptiveColorsUnavailable(error instanceof Error ? error.message : String(error));
    return null;
  }
}

export function getAdaptiveColors(): AdaptiveColors | null {
  if (Platform.OS === 'android') return getAndroidColors();
  if (Platform.OS === 'ios') return getIOSColors();
  return null;
}
