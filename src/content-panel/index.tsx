/**
 * Native variant of `ContentPanel` — the framed app-content surface.
 *
 * `ContentPanel` is the rounded, bordered panel that holds an app's routed
 * content. On WEB it adds two sticky overlays (a gutter "bleed-mask" box-shadow
 * ring and a continuous rounded border frame) so feed content that bleeds into
 * the rounded corners / lateral gutters is masked while a single seamless border
 * is drawn around the panel — see `index.web.tsx`.
 *
 * On NATIVE none of that applies: there is no document scroll, no sticky
 * positioning, and no bleed to mask, so the panel is simply a rounded, bordered
 * surface wrapping its content. The `framed` and `showStickyFrame` props are
 * accepted for cross-platform API parity but are intentionally no-ops here
 * (mirroring the no-op native fork of `../scroll`).
 *
 * Web bundlers select `./index.web` via the `"browser"` export condition in
 * `package.json`; native bundlers fall through to this file.
 *
 * Styling is NativeWind-className-first; the literal class strings below must
 * stay literal so a consumer's Tailwind content-scan over `lib/**` (and the
 * native `src/**`) picks them up.
 */
import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Width (in px) of the WEB sticky gutter-mask box-shadow ring. Exported for
 * cross-platform API parity (it has no effect on native).
 */
export const GUTTER_MASK_SPREAD = 40;
/** Top sticky inset (px) of the framed panel chrome. */
export const PANEL_TOP_INSET = 8;
/** Bottom sticky inset (px) of the framed panel chrome. */
export const PANEL_BOTTOM_INSET = 8;

export interface ContentPanelProps {
  children: React.ReactNode;
  /**
   * Whether the panel is framed (wide screens) or full-bleed (narrow screens).
   * No-op on native — the surface is always a rounded, bordered View.
   */
  framed: boolean;
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

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  surfaceClassName,
  surfaceStyle,
  contentClassName,
  contentStyle,
}) => {
  const surfaceClass = [
    'flex-1',
    'rounded-radius-28',
    'overflow-hidden border border-border',
    surfaceClassName ?? 'bg-card',
  ].join(' ');
  const contentClass = ['flex-1', contentClassName].filter(Boolean).join(' ');

  return (
    <View
      {...({ className: surfaceClass } as Record<string, string>)}
      style={surfaceStyle}
    >
      <View
        {...({ className: contentClass } as Record<string, string>)}
        style={contentStyle}
      >
        {children}
      </View>
    </View>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
