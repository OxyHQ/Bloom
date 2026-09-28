import { processColor } from 'react-native';

/** Native SVG gradient stops require their alpha as a separate stopOpacity prop. */
export function svgColor(color: string): { color: string; opacity: number } {
  const value = processColor(color);
  if (typeof value !== 'number') return { color, opacity: 1 };
  const argb = value >>> 0;
  return {
    color: `rgb(${(argb >>> 16) & 255}, ${(argb >>> 8) & 255}, ${argb & 255})`,
    opacity: (argb >>> 24) / 255,
  };
}
