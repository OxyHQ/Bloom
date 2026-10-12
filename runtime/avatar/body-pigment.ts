type LinearRGB = { r: number; g: number; b: number };

/** Bound only the rendered body pigment, never the user's saved RGB choice.
 * Linear-light luminance treats dark blue and pale yellow differently. Mixing
 * toward a neutral endpoint keeps channels in gamut, including pure black. */
export function boundBodyPigment(color: LinearRGB): void {
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  const target = Math.min(0.68, Math.max(0.21, luminance));
  if (target === luminance) return;
  const neutral = target > luminance ? 1 : 0;
  const mix = (target - luminance) / (neutral - luminance);
  color.r += (neutral - color.r) * mix;
  color.g += (neutral - color.g) * mix;
  color.b += (neutral - color.b) * mix;
}
