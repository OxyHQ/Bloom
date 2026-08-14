import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

/**
 * Viewport width (px) at which a RESPONSIVE `ContentPanel` (`framed` undefined)
 * switches from full-bleed to framed. Each value maps to a PRE-SHIPPED literal
 * Tailwind class bundle — `768` (default) uses the named `md:` screen
 * (byte-identical to prior behavior), `640` uses `sm:`, `1024` uses `lg:`, and
 * `500` uses the arbitrary `min-[500px]:` variant (there is no named screen at
 * 500px). The breakpoint tokens are never built at runtime, so a consumer's
 * Tailwind content-scan over `src/**`/`lib/**` resolves them verbatim.
 */
export type ContentPanelFramedBreakpoint = 500 | 640 | 768 | 1024;

export interface ContentPanelProps {
  children: React.ReactNode;
  /**
   * Framing mode. Tri-state, resolved purely with NativeWind — no consumer
   * breakpoint hook needed:
   * - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
   *   breakpoint, rounded + bordered at/above it.
   * - `false` → never framed (plain full-bleed at every size).
   * - `true` → always rounded + bordered.
   */
  framed?: boolean;
  /**
   * Viewport width at which the RESPONSIVE panel switches from full-bleed to
   * framed. Only meaningful when `framed` is `undefined` (responsive) — ignored
   * when `framed` is `true` (always framed) or `false` (never framed). Defaults
   * to `768` (Tailwind `md`), reproducing the prior fixed behavior exactly.
   */
  framedFrom?: ContentPanelFramedBreakpoint;
  /** Override the surface background utility (defaults to `bg-card`). */
  surfaceClassName?: string;
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Extra utilities for the inner content wrapper. */
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to render the WEB sticky border frame. No-op on native (the border
   * is always part of the surface).
   */
  showStickyFrame?: boolean;
  /**
   * Color of the WEB sticky bleed-mask gutter ring. Accepted for cross-platform
   * API parity — no-op on native (there is no bleed-mask), like `framed`.
   */
  maskColor?: string;
}
