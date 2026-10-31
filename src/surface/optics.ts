/** One frosted body with a rounded, self-painted rim and inner relief. */
export interface SurfaceLook {
  saturate: number;
  slope: number;
  offset: number;
  /** Full contour, upper edge and lower reflected edge. */
  edge: { line: number; top: number; bottom: number };
  /** Upper-left shoulder and lower-right inner shade. */
  relief: { light: number; shade: number };
}

export const SURFACE_LOOKS: { light: SurfaceLook; dark: SurfaceLook } = {
  light: {
    saturate: 1.8705,
    slope: 0.6098,
    offset: 98.2,
    edge: { line: 0.24, top: 0.68, bottom: 0.3 },
    relief: { light: 0.45, shade: 0.24 },
  },
  dark: {
    saturate: 1.2652,
    slope: 0.8684,
    offset: 32.48,
    edge: { line: 0.2, top: 0.58, bottom: 0.26 },
    relief: { light: 0.25, shade: 0.26 },
  },
};

/** Frosting radius, in CSS px. */
export const SURFACE_BLUR_PX = 24;
const RELIEF_BLUR_PX = 24;
/** Offset + spread + three-sigma blur support, kept before a control's label. */
const CONTROL_RELIEF_REACH_PX = 14 - 10 + 1.5 * RELIEF_BLUR_PX;

/** A control's existing content inset bounds the body lighting's reach. */
export function controlReliefScale(height: number, lineHeight: number): number {
  return Math.min(1, Math.max(0, (height - lineHeight) / 2) / CONTROL_RELIEF_REACH_PX);
}

/**
 * A fine rim follows the entire silhouette, with directional edge reflections.
 * All lengths are numeric CSS px so the same recipe works on React Native.
 */
export function rimLight({ edge }: SurfaceLook): string {
  return [
    `inset 0 0 0 1px rgba(255, 255, 255, ${edge.line})`,
    `inset 0.5px 1px 1px rgba(255, 255, 255, ${edge.top})`,
    `inset -0.5px -1px 2px rgba(255, 255, 255, ${edge.bottom})`,
  ].join(', ');
}

/**
 * Light rolls into the body from the upper left, with shade on the lower right.
 * The bevel stays inside the shape and leaves large reading surfaces quiet in
 * the centre. It modulates the resolved tint; it never selects a semantic hue.
 * Web and native paint this same recipe without a gradient or layout reads.
 */
export function bodyRelief({ relief }: SurfaceLook, scale = 1): string {
  const bounded = Number.isFinite(scale) ? Math.min(1, Math.max(0, scale)) : 1;
  if (bounded === 0) return '';
  const px = (value: number) => `${Math.round(value * bounded * 100) / 100}px`;
  return [
    `inset ${px(2)} ${px(14)} ${px(RELIEF_BLUR_PX)} ${px(-10)} rgba(255, 255, 255, ${relief.light})`,
    `inset ${px(-2)} ${px(-14)} ${px(RELIEF_BLUR_PX)} ${px(-10)} rgba(0, 0, 0, ${relief.shade})`,
  ].join(', ');
}

/** The backdrop under the tint: frosted, saturated, flattened, brightened. */
export function materialFilter({ saturate, slope, offset }: SurfaceLook): string {
  const brightness = slope + (2 * offset) / 255;
  return `blur(${SURFACE_BLUR_PX}px) saturate(${saturate}) contrast(${(slope / brightness).toFixed(5)}) brightness(${brightness.toFixed(5)})`;
}
