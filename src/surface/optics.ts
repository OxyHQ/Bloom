/**
 * The material of Astro's pinned tabs, measured in light and dark: the backdrop is
 * saturated, flattened and brightened under the tint, and the edge brightens the
 * backdrop again through a mask that is strongest along the top and bottom edges,
 * fades as each corner turns vertical, and glows down from the top.
 */
export type OpticsCurve = readonly (readonly [x: number, y: number])[];

export interface SurfaceRim {
  /** Edge angle in degrees: 0 along the top and bottom, 90 along the sides. */
  angles: readonly number[];
  /** Distance inward from the edge, in CSS px. */
  depths: readonly number[];
  /** Brightness gain per angle (rows) and depth (columns). */
  gains: readonly (readonly number[])[];
  /** Extra gain by distance from the top (and, mirrored, the bottom). */
  glow: OpticsCurve;
  glowByAngle: OpticsCurve;
}

export interface SurfaceLook {
  saturate: number;
  slope: number;
  offset: number;
  rim: SurfaceRim;
  /** Shallow, directional relief inside the body; independent of the backdrop. */
  relief: { light: number; shade: number };
}

const RIM_ANGLES = [0, 1, 8.5, 25, 45, 65, 81.5, 89, 90];
const RIM_DEPTHS = [0, 0.25, 0.75, 1.25, 1.75];
const GLOW_BY_ANGLE: OpticsCurve = [
  [0, 1],
  [5, 0.9],
  [10, 0.8],
  [20, 0.7],
  [35, 0.6],
  [90, 0.6],
];

export const SURFACE_LOOKS: { light: SurfaceLook; dark: SurfaceLook } = {
  light: {
    relief: { light: 0.12, shade: 0.06 },
    saturate: 1.8705,
    slope: 0.6098,
    offset: 98.2,
    rim: {
      angles: RIM_ANGLES,
      depths: RIM_DEPTHS,
      gains: [
        [0.42, 0.42, 0.16, 0, 0],
        [0.16, 0.16, 0.13, 0, 0],
        [0.16, 0.16, 0.12, 0, 0],
        [0.1, 0.105, 0.04, 0, 0],
        [0.085, 0.088, 0.03, 0, 0],
        [0.11, 0.114, 0.033, 0, 0],
        [0.03, 0.03, 0.045, 0.025, 0.01],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      glow: [
        [0, 0.14],
        [1.25, 0.14],
        [1.75, 0.12],
        [2.25, 0.1],
        [2.75, 0.09],
        [3.25, 0.08],
        [3.75, 0.07],
        [4.25, 0.06],
        [5, 0.05],
        [6, 0.03],
        [7, 0.015],
        [8, 0],
      ],
      glowByAngle: GLOW_BY_ANGLE,
    },
  },
  dark: {
    relief: { light: 0.06, shade: 0.12 },
    saturate: 1.2652,
    slope: 0.8684,
    offset: 32.48,
    rim: {
      angles: RIM_ANGLES,
      depths: RIM_DEPTHS,
      gains: [
        [0.55, 0.55, 0.26, 0, 0],
        [0.22, 0.22, 0.2, 0, 0],
        [0.18, 0.18, 0.18, 0, 0],
        [0.16, 0.168, 0.05, 0, 0],
        [0.18, 0.186, 0.065, 0, 0],
        [0.106, 0.107, 0.039, 0, 0],
        [0, 0, 0.05, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      glow: [
        [0, 0.14],
        [1.25, 0.14],
        [1.75, 0.11],
        [2.25, 0.09],
        [2.75, 0.07],
        [3.25, 0.05],
        [3.75, 0.04],
        [4.25, 0.03],
        [5, 0.02],
        [6, 0.01],
        [7, 0],
      ],
      glowByAngle: GLOW_BY_ANGLE,
    },
  },
};

export function interpolate(curve: OpticsCurve, x: number): number {
  if (x <= curve[0]![0]) return curve[0]![1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i]!;
    if (x <= x1) {
      const [x0, y0] = curve[i - 1]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return curve[curve.length - 1]![1];
}

export function rimGain(rim: SurfaceRim, inward: number, angle: number): number {
  const rows = rim.angles.map(
    (a, i) =>
      [
        a,
        interpolate(
          rim.depths.map((d, j) => [d, rim.gains[i]![j]!] as const),
          inward,
        ),
      ] as const,
  );
  return interpolate(rows, angle);
}

export function edgeGain(rim: SurfaceRim, inward: number): number {
  return rimGain(rim, inward, 0) + interpolate(rim.glow, inward);
}

export function peakGain(rim: SurfaceRim): number {
  return edgeGain(rim, 0);
}

/** Frosting radius, in CSS px. */
export const SURFACE_BLUR_PX = 24;

/**
 * The same inset relief on web and native. A short, fixed reach leaves the
 * centre of large reading surfaces quiet while rounding smaller controls.
 * Neutral light/shade modulates the resolved tint, never chooses a new hue or
 * semantic fill. No layout reads, native gradients or additional backdrop pass.
 */
export function bodyRelief({ relief }: SurfaceLook): string {
  return [
    `inset 2px 6px 12px -6px rgba(255, 255, 255, ${relief.light})`,
    `inset -2px -6px 12px -6px rgba(0, 0, 0, ${relief.shade})`,
  ].join(', ');
}

/** The backdrop under the tint: frosted, saturated, flattened, brightened. */
export function materialFilter({ saturate, slope, offset }: SurfaceLook): string {
  const brightness = slope + (2 * offset) / 255;
  return `blur(${SURFACE_BLUR_PX}px) saturate(${saturate}) contrast(${(slope / brightness).toFixed(5)}) brightness(${brightness.toFixed(5)})`;
}

/** The edge: the backdrop brightened by the rim's peak gain, shown through the mask. */
export function edgeLightFilter(look: SurfaceLook): string {
  return `brightness(${(1 + peakGain(look.rim)).toFixed(4)})`;
}

/**
 * The glow under the edge line, as a mask: the measured gain by depth from the
 * top and bottom edges, relative to the peak the edge filter applies.
 */
export function edgeGlowMask(rim: SurfaceRim): string {
  const peak = peakGain(rim);
  const alpha = (gain: number) => `rgba(0,0,0,${(gain / peak).toFixed(3)})`;
  const top = rim.glow.map(([depth, gain]) => `${alpha(gain)} ${depth}px`).join(', ');
  const bottom = [...rim.glow]
    .reverse()
    .map(([depth, gain]) => `${alpha(gain)} calc(100% - ${depth}px)`)
    .join(', ');
  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}
