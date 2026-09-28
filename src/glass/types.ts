import type { SurfaceShape, CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface GlassBlurTargetProviderProps {
  children?: ReactNode;
  /**
   * Style for the wrapping target view. Defaults to `flex: 1`, which is what an
   * app root wants; pass your own only if this is wrapping something smaller.
   */
  style?: StyleProp<ViewStyle>;
}

export interface GlassBlurWindowProps {
  children?: ReactNode;
}

/**
 * Which of the two glass ROLES a pane paints.
 *
 * `accent` is a brand fill over one of Bloom's own neutral surfaces — a
 * `primary` control, labelled with that fill's own on-colour. `chrome` is a
 * neutral surface off the ladder (`styles/surface-levels`) over content Bloom
 * does NOT own — a page header's island — labelled with the theme's own `text`.
 *
 * They carry different alphas because they are priced against different
 * backdrops, and in opposite directions; the measurement is on
 * {@link ../theme/glass-colors#GLASS_CHROME_ALPHA}.
 */
export type GlassMaterial = 'accent' | 'chrome';

/** Geometry belongs to the shape/radius props, and clipping belongs to the material. */
type GlassStyle = Omit<ViewStyle, Extract<keyof ViewStyle, `border${string}Radius` | `border${string}Width` | 'borderCurve' | 'overflow'>>;

export interface GlassSurfaceProps {
  /**
   * The OPAQUE brand fill the pane is tinted with — `theme.colors.primary`,
   * `theme.colors.negative`, and so on. The material composes the translucent
   * tint and the full-strength hairline from it.
   *
   * A resolved token rather than a tone NAME because the caller is the only one
   * who knows which token its surface means: `Button`'s `destructive` is
   * `colors.negative`, which is a different colour from `colors.error` in all 36
   * preset x mode combinations.
   */
  fill: string;
  /** Exact surface policy of the caller; shared by blur, fill and rim. */
  shape: SurfaceShape & { radius: NonNullable<SurfaceShape['radius']> };
  /** Resolves logical corners consistently with the caller. Defaults to ltr. */
  direction?: 'ltr' | 'rtl';
  /**
   * Which role's alpha to apply to `fill`. Default `accent`.
   *
   * A pane cannot infer this from the colour it is given — `chrome`'s fill is a
   * neutral that in light mode IS `colors.card`, which an accent pane could
   * legitimately be asked to paint too.
   */
  material?: GlassMaterial;
  /**
   * Whether to paint the sheen — the top-lit gradient that separates glass from
   * flat tinted plastic.
   *
   * Present because the sheen is the one layer with a cost worth letting a
   * caller decline: it is an SVG node per surface, and on a surface that is
   * small or already busy it contributes little. It is ON by default because
   * measuring it against a flat tint is what decided it was worth having.
   */
  sheen?: boolean;
  /** Extra non-geometric style for the clipped layer stack. Shape and clipping remain authoritative. */
  style?: StyleProp<GlassStyle>;
  testID?: string;
}

export interface GlassIslandProps {
  children?: ReactNode;
  /**
   * Corner radius. A full pill by default — an island is a capsule, and a
   * capsule of icon-only controls is what makes the row read as separated
   * groups rather than as one bar.
   */
  radius?: number;
  /** Curve for non-capsule islands. */
  cornerCurve?: CornerCurve;
  /**
   * `'group'` when the island holds several RELATED actions the consumer has
   * declared as one group. Omitted for a single control in its own capsule: a
   * group of one is noise for a screen reader, and the control already names
   * itself.
   */
  role?: 'group';
  /** Names the group. Required by `role="group"` to be worth announcing. */
  accessibilityLabel?: string;
  /** Forwarded to the material. See {@link GlassSurfaceProps.sheen}. */
  sheen?: boolean;
  style?: StyleProp<GlassStyle>;
  testID?: string;
}
