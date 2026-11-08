import { parseRgba } from "../theme/color-utils";
import { quietTextOver, relativeLuminance } from "../styles/color-contrast";
import {
  filterColorBounds,
  parseLook,
  type ColorBounds,
  type RGB,
} from "./filter-color";
import { materialFilter, maximumEdgeGain, SURFACE_LOOKS } from "./optics";

/** Unknown sampler input includes every sRGB pixel, including outside a parent/rim. */
export const UNKNOWN_BACKING: ColorBounds = { min: [0, 0, 0], max: [1, 1, 1] };
const looks = {
  light: parseLook(materialFilter(SURFACE_LOOKS.light))!,
  dark: parseLook(materialFilter(SURFACE_LOOKS.dark))!,
};

export function solidBacking(fill: string): ColorBounds | undefined {
  const color = parseRgba(fill);
  if (!color || color.a !== 1) return undefined;
  const rgb: RGB = [color.r / 255, color.g / 255, color.b / 255];
  return { min: rgb, max: rgb };
}

/** Body bounds include functioning and omitted backdrop effects; inset adds regional edge gain. */
export function surfaceBodyBounds(
  tint: string,
  mode: "light" | "dark",
  sampler: ColorBounds = UNKNOWN_BACKING,
  interiorInset = Infinity,
): ColorBounds | undefined {
  const color = parseRgba(tint);
  if (!color || color.a <= 0) return undefined;
  const filtered = filterColorBounds(sampler, looks[mode]);
  // CSS support does not prove a renderer actually applies backdrop-filter.
  // Enclose both outputs without user-agent detection or changing material paint.
  const lower: RGB = [
    Math.min(filtered.min[0], sampler.min[0]),
    Math.min(filtered.min[1], sampler.min[1]),
    Math.min(filtered.min[2], sampler.min[2]),
  ];
  const upper: RGB = [
    Math.max(filtered.max[0], sampler.max[0]),
    Math.max(filtered.max[1], sampler.max[1]),
    Math.max(filtered.max[2], sampler.max[2]),
  ];
  const channels = [color.r, color.g, color.b];
  const edgeGain = Number.isFinite(interiorInset)
    ? maximumEdgeGain(SURFACE_LOOKS[mode].rim, Math.max(0, interiorInset))
    : 0;
  const composite = (back: RGB, slack: number, gain = 0): RGB => {
    const channel = (index: number) =>
      Math.max(
        0,
        Math.min(
          1,
          ((channels[index]! / 255) * color.a + back[index]! * (1 - color.a)) *
            (1 + gain) +
            slack / 255,
        ),
      );
    return [channel(0), channel(1), channel(2)];
  };
  // One output-channel unit covers the measured Chromium body quantization.
  // Other engines and complete edge paint still require their own pixel checks.
  return {
    min: composite(lower, -1),
    max: composite(upper, edgeGain > 0 ? 2 : 1, edgeGain),
  };
}

const cssColor = (rgb: RGB, upper: boolean): string =>
  `rgb(${rgb.map((v) => (upper ? Math.ceil(v * 255) : Math.floor(v * 255))).join(", ")})`;

/** Semantic quiet text with an explicit failure result, including interval interiors. */
export function quietTextOnBody(
  bounds: ColorBounds,
  text: string,
  floor: number,
) {
  const lower = cssColor(bounds.min, false);
  const upper = cssColor(bounds.max, true);
  const color = quietTextOver([lower, upper], text, floor);
  const lo = relativeLuminance(lower)!;
  const hi = relativeLuminance(upper)!;
  const value = relativeLuminance(color);
  const ratio =
    value === null || (value >= lo && value <= hi)
      ? 1
      : value < lo
        ? (lo + 0.05) / (value + 0.05)
        : (value + 0.05) / (hi + 0.05);
  return { color, ratio, satisfied: ratio >= floor };
}
