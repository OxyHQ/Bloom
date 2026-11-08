export type RGB = readonly [number, number, number];

export type Look = readonly (readonly [name: string, amount: number])[];

/** The colour functions of a material filter, in order; blur is dropped (flat in, flat out). */
export function parseLook(filter: string): Look | null {
  const steps: [string, number][] = [];
  for (const match of filter.matchAll(/([a-z-]+)\(([^)]*)\)/g)) {
    const name = match[1] ?? '';
    if (name === 'blur') continue;
    const amount = Number.parseFloat(match[2] ?? '');
    if (!['saturate', 'contrast', 'brightness'].includes(name) || !Number.isFinite(amount))
      return null;
    steps.push([name, amount]);
  }
  return steps.length ? steps : null;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A flat colour through the material's filter, as the CSS Filter Effects
 * functions define them (sRGB, each step clamped).
 */
export function filterColor(color: RGB, look: Look): RGB {
  let [r, g, b] = color;
  for (const [name, s] of look) {
    if (name === 'saturate') {
      [r, g, b] = [
        clamp((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
        clamp((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
        clamp((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
      ];
    } else if (name === 'contrast') {
      const k = (v: number) => clamp((v - 0.5) * s + 0.5);
      [r, g, b] = [k(r), k(g), k(b)];
    } else {
      [r, g, b] = [clamp(r * s), clamp(g * s), clamp(b * s)];
    }
  }
  return [r, g, b];
}

/** Independent sRGB channel bounds in [0, 1], not a sampled or average colour. */
export interface ColorBounds {
  min: RGB;
  max: RGB;
}

/**
 * Conservative enclosure for these affine/clamped CSS stages. Each stage's
 * extrema occur at a corner of its incoming RGB box, including negative
 * saturation coefficients. Keeping independent channels may widen the box;
 * it never assumes the channel extrema can occur at one physical pixel.
 * Blur averages colours and cannot escape the incoming box. This does not
 * model a separately painted edge, blend mode, HDR or colour outside sRGB.
 */
export function filterColorBounds(bounds: ColorBounds, look: Look): ColorBounds {
  for (let channel = 0; channel < 3; channel++) {
    const min = bounds.min[channel]!;
    const max = bounds.max[channel]!;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 1 || min > max) {
      throw new RangeError('Expected ordered sRGB bounds in [0, 1]');
    }
  }
  let result = bounds;
  for (const step of look) {
    if (
      !['saturate', 'contrast', 'brightness'].includes(step[0]) ||
      !Number.isFinite(step[1]) ||
      step[1] < 0
    ) {
      throw new RangeError('Unsupported numeric filter stage');
    }
    const colors = Array.from({ length: 8 }, (_, bits) =>
      filterColor(
        [
          bits & 1 ? result.max[0] : result.min[0],
          bits & 2 ? result.max[1] : result.min[1],
          bits & 4 ? result.max[2] : result.min[2],
        ],
        [step],
      ),
    );
    const low = (channel: number) => Math.min(...colors.map((c) => c[channel]!));
    const high = (channel: number) => Math.max(...colors.map((c) => c[channel]!));
    result = { min: [low(0), low(1), low(2)], max: [high(0), high(1), high(2)] };
  }
  return result;
}
