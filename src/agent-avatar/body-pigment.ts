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

/** Match the engine's linear pigment in an sRGB UI swatch. The input remains
 * the user's saved hex; this derived color is only for rendering a preview. */
export function bodyPigmentHex(hex: string): string {
  if (!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(hex))
    throw new Error('Avatar pigment preview requires an RGB hex color');
  const value =
    hex.length === 4
      ? hex
          .slice(1)
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : hex.slice(1);
  // The standalone renderer uses Three's sRGB transfer functions. Keep the
  // conversion byte-equivalent without linking WebGL/Three into the RN SDK.
  const linear = (byte: number) => {
    const c = byte / 255;
    return c < 0.04045 ? c * 0.0773993808 : (c * 0.9478672986 + 0.0521327014) ** 2.4;
  };
  const color = {
    r: linear(Number.parseInt(value.slice(0, 2), 16)),
    g: linear(Number.parseInt(value.slice(2, 4), 16)),
    b: linear(Number.parseInt(value.slice(4, 6), 16)),
  };
  boundBodyPigment(color);
  const channel = (c: number) => {
    const srgb = c < 0.0031308 ? c * 12.92 : 1.055 * c ** 0.41666 - 0.055;
    return Math.round(srgb * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}
