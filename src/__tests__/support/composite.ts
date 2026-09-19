/**
 * Compositing and WCAG maths for suites that measure a TRANSLUCENT surface.
 *
 * A pane you can see through has no colour of its own to read off a style prop:
 * what a label lands on is the fill flattened onto whatever is behind it. Every
 * gate on a glass material therefore needs the same four functions, and they
 * are here so a new one does not start by copying them — which is how two
 * copies of a luminance formula end up disagreeing about the sRGB knee.
 *
 * `theme/__tests__/glass-colors.test.ts` keeps its OWN copies, deliberately and
 * with its own reasons written down; this is for everything since.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parse `#rgb`, `#rrggbb`, `rgb(...)` or `rgba(...)`. Throws on anything else. */
export function parseColor(value: string): Rgba {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hex?.[1] !== undefined) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(value.trim());
  if (!fn?.[1]) throw new Error(`unparseable colour: ${JSON.stringify(value)}`);
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`unparseable colour: ${JSON.stringify(value)}`);
  }
  return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 };
}

/** Flatten a translucent colour onto an opaque one — source-over. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  return {
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgba): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, order-independent. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
export const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
