import type { ResolvedAvatarCharacter } from './character';

export type VectorAction = 'idle' | 'reaction' | 'work';
export type VectorChannel = { value?: number[]; samples?: number[] };
export type VectorTrack = {
  translation: VectorChannel;
  rotation: VectorChannel;
  scale: VectorChannel;
  camera?: VectorChannel;
  coverage?: VectorChannel;
  matrix?: VectorChannel;
  parameters?: VectorChannel;
};
export type VectorPart = {
  id: number | string;
  label: string;
  role?: string;
  color?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  face?: boolean;
  /** Rigid accessory attached to the reference head, independent of eye deformation. */
  head?: boolean;
  /** Local contact point about which fitted reference headwear turns. */
  headPivot?: number[];
  bodyPaint?: boolean;
  points: number[][];
  faces: number[][];
  edges: number[][];
  delta0?: number[][];
  delta1?: number[][];
};
export type VectorClip = { duration: number; fps: number; parts: (VectorTrack | null)[] };
export type VectorData = {
  referenceFace?: {
    center: [number, number];
    radius: number;
    gazeScale: number;
    restBasis?: number[];
    restQuaternion?: number[];
    sphereRadius?: number;
    eyePlanes?: { center: number[]; normal: number[] }[];
  };
  parts: VectorPart[];
  clips: Record<VectorAction, VectorClip>;
};
export type VectorAssetLoader = {
  shape(id: ResolvedAvatarCharacter['shape']): Promise<VectorData>;
  eyes(id: ResolvedAvatarCharacter['eyes']): Promise<VectorData>;
  eyewear(id: ResolvedAvatarCharacter['eyewear']): Promise<VectorData>;
  accessory(id: ResolvedAvatarCharacter['accessory']): Promise<VectorData>;
  template(character: ResolvedAvatarCharacter): Promise<VectorData | undefined>;
};
export type VectorDrawPath = {
  id: string;
  role?: string;
  d: string;
  fill: string;
  opacity: number;
  fillOpacity: number;
  clip?: string;
  stroke?: string;
  strokeWidth?: number;
};
export type VectorFrame = { paths: VectorDrawPath[]; viewBox: string };
