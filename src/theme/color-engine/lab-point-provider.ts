/**
 * Bloom colour engine — L*a*b* point provider.
 *
 * Faithful port of Material Color Utilities' `LabPointProvider` (Apache-2.0).
 * Quantization clusters colours in L*a*b* (perceptually even), so pixels map to
 * points and back through here, with squared-distance as the metric.
 */
import { argbFromLab, labFromArgb } from './color-utils';

export type LabPoint = [number, number, number];

export function labFromInt(argb: number): LabPoint {
  return labFromArgb(argb);
}

export function intFromLab(point: LabPoint): number {
  return argbFromLab(point[0], point[1], point[2]);
}

/** Squared Euclidean distance in L*a*b* (cheaper than the real distance). */
export function labDistance(from: LabPoint, to: LabPoint): number {
  const dL = from[0] - to[0];
  const dA = from[1] - to[1];
  const dB = from[2] - to[2];
  return dL * dL + dA * dA + dB * dB;
}
