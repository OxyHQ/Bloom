import React, { useRef } from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { useFonts } from 'expo-font';
import { FONT_ASSETS } from './font-assets';

export interface FontLoaderProps {
  /**
   * Whether to gate rendering on fonts being loaded. When false the
   * component is a pass-through that still calls `useFonts` (the hook must
   * run unconditionally per the Rules of Hooks).
   */
  enabled: boolean;
  /** Rendered while native fonts load. Defaults to `null`. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * React Native's `Text` exposes a static `defaultProps` for app-wide prop
 * defaults. The public type definition omits it (it's an implementation
 * detail, not part of the stable API), so we describe it locally rather
 * than casting to `any`.
 */
type TextWithDefaults = typeof Text & {
  defaultProps?: Partial<TextProps>;
};

/**
 * Mutates `Text.defaultProps.style` so every native `<Text>` in the consuming
 * app inherits Bloom's default font (BlomusModernus). The Bloom family name
 * is prepended to any existing default style so caller-provided `style`
 * (which React applies AFTER `defaultProps.style`) still wins for overrides.
 *
 * Idempotent: re-invoking it after the first apply is a no-op because the
 * first style entry will already be the Bloom default we added.
 */
function applyDefaultTextFont(): void {
  const TextWithDefaults = Text as TextWithDefaults;
  const existing = TextWithDefaults.defaultProps?.style;
  const bloomDefault: TextStyle = { fontFamily: 'BlomusModernus' };

  // Detect whether we've already prepended ourselves. `existing` may be an
  // array (multiple style fragments), a single object, a registered style
  // number, or undefined. Only the array/object cases need inspection — if
  // it's a number, we can't read the contents so we just prepend.
  if (Array.isArray(existing)) {
    const first = existing[0];
    if (
      first &&
      typeof first === 'object' &&
      !Array.isArray(first) &&
      (first as TextStyle).fontFamily === bloomDefault.fontFamily
    ) {
      return;
    }
  } else if (
    existing &&
    typeof existing === 'object' &&
    (existing as TextStyle).fontFamily === bloomDefault.fontFamily
  ) {
    return;
  }

  const nextStyle: StyleProp<TextStyle> =
    existing == null ? bloomDefault : [bloomDefault, existing];

  TextWithDefaults.defaultProps = {
    ...TextWithDefaults.defaultProps,
    style: nextStyle,
  };
}

/**
 * Native font loader. Calls `expo-font`'s `useFonts` with the Bloom font
 * asset map and gates `children` on the load result. The hook is invoked
 * unconditionally — `enabled` only affects what's rendered, not whether
 * fonts get loaded. This keeps Hook order stable across renders and means
 * `<BloomThemeProvider fonts={false}>` still gets fonts pre-loaded if the
 * provider tree ever flips `fonts` back on.
 *
 * Once the bundled fonts report `loaded === true`, this component also
 * mutates `Text.defaultProps.style` to prepend `{ fontFamily: 'BlomusModernus' }`
 * so every native `<Text>` in the consuming app inherits Bloom's default
 * family without callers needing to import `<Text>` from `@oxyhq/bloom`.
 * The mutation is gated by a `useRef` so it runs at most once per
 * FontLoader instance, and the underlying apply is idempotent — the
 * Bloom default is prepended to any caller `defaultProps.style`, so
 * per-call `style` overrides (which React applies after `defaultProps`)
 * still take precedence.
 */
export function FontLoader({ enabled, fallback, children }: FontLoaderProps) {
  const [loaded] = useFonts(FONT_ASSETS);
  const defaultsApplied = useRef(false);

  if (loaded && !defaultsApplied.current) {
    defaultsApplied.current = true;
    applyDefaultTextFont();
  }

  if (!enabled) return <>{children}</>;
  if (!loaded) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
