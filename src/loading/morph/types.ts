import type { Cubic } from './cubic';
import type { RoundedPolygon } from './polygon';

interface Point {
  x: number;
  y: number;
}

interface CornerRounding {
  radius: number;
  smoothing: number;
}

type Feature =
  | { type: 'edge'; cubics: Cubic[] }
  | { type: 'corner'; cubics: Cubic[]; convex: boolean };

interface PointNRound {
  r: CornerRounding;
  x: number;
  y: number;
}

type ShapeFactory = () => RoundedPolygon;

interface Measurer {
  findCubicCutPoint(c: Cubic, m: number): number;
  measureCubic(c: Cubic): number;
}

interface ProgressableFeature {
  feature: Feature;
  progress: number;
}

interface MeasuredCubic {
  cubic: Cubic;
  endOutlineProgress: number;
  measuredSize: number;
  startOutlineProgress: number;
}

interface MeasuredPolygon {
  cubics: MeasuredCubic[];
  features: ProgressableFeature[];
  measurer: Measurer;
}

interface MorphFrames {
  readonly flat: number[];
  readonly frameCount: number;
}

export type {
  Point,
  CornerRounding,
  MorphFrames,
  MeasuredPolygon,
  ShapeFactory,
  PointNRound,
  Feature,
  MeasuredCubic,
  Measurer,
  ProgressableFeature,
};
