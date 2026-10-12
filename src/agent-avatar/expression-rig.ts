import type { AvatarConfig } from './model';

/** Optical sizing is based on CSS pixels, never the canvas's Retina resolution.
 * Keep the saved recipe unchanged; the same agent adapts to its display size.
 */
export function faceAtSize(config: AvatarConfig, cssSize: number): AvatarConfig {
  const small = Math.max(0, Math.min(1, (64 - cssSize) / 40));
  if (small === 0) return config;
  return {
    ...config,
    eyeSize: Math.min(36, config.eyeSize * (1 + small * (config.family === 'alien' ? 0.22 : 0.35))),
    eyeGap: config.eyeGap * (1 + small * 0.14),
  };
}

/** A small continuous face rig: expressions interpolate instead of swapping icons. */
export type FaceRig = {
  leftOpen: number;
  rightOpen: number;
  width: number;
  smile: number;
  leftAngle: number;
  rightAngle: number;
  brow: number;
  browAngle: number;
  browLift: number;
  browAsymmetry: number;
  lookX: number;
  lookY: number;
  headTilt: number;
  bounce: number;
  tremble: number;
  blink: number;
};

const NEUTRAL: FaceRig = {
  leftOpen: 1,
  rightOpen: 1,
  width: 0.45,
  smile: 0,
  leftAngle: -0.08,
  rightAngle: -0.08,
  brow: 0,
  browAngle: 0,
  browLift: 0,
  browAsymmetry: 0,
  lookX: 0,
  lookY: 0,
  headTilt: 0,
  bounce: 0,
  tremble: 0,
  blink: 1,
};

const EXPRESSIONS: Record<AvatarConfig['eyes'], Partial<FaceRig>> = {
  neutral: {},
  happy: { leftOpen: 0.75, rightOpen: 0.75, width: 0.53, smile: 1, bounce: 1 },
  angry: {
    leftOpen: 0.45,
    rightOpen: 0.45,
    width: 0.52,
    leftAngle: 0.35,
    rightAngle: -0.35,
    brow: 1,
    browAngle: 0.45,
    browLift: -2,
    headTilt: -0.07,
    lookY: 2,
  },
  thinking: {
    leftOpen: 0.7,
    rightOpen: 0.42,
    brow: 0.9,
    browAngle: -0.1,
    browLift: 2,
    browAsymmetry: 6,
    lookX: 8,
    lookY: -9,
    headTilt: 0.15,
  },
  shook: {
    leftOpen: 1.55,
    rightOpen: 1.55,
    width: 0.57,
    brow: 1,
    browLift: 11,
    browAngle: -0.15,
    lookY: -2,
    tremble: 1,
  },
  curious: {
    leftOpen: 1.15,
    rightOpen: 0.68,
    brow: 0.8,
    browLift: 4,
    browAsymmetry: 8,
    lookX: 4,
    lookY: -3,
    headTilt: -0.13,
  },
  wink: {
    leftOpen: 1,
    rightOpen: 0.08,
    width: 0.45,
    rightAngle: -0.13,
    headTilt: -0.1,
    bounce: 0.3,
  },
  sleepy: {
    leftOpen: 0.18,
    rightOpen: 0.18,
    width: 0.55,
    leftAngle: 0.08,
    rightAngle: -0.08,
    lookY: 5,
    headTilt: 0.12,
  },
  sad: {
    leftOpen: 0.48,
    rightOpen: 0.48,
    width: 0.48,
    leftAngle: -0.28,
    rightAngle: 0.28,
    brow: 0.85,
    browAngle: -0.65,
    browLift: -1,
    lookY: 7,
    headTilt: 0.07,
  },
  worried: {
    leftOpen: 1.1,
    rightOpen: 1.1,
    width: 0.34,
    brow: 1,
    browAngle: -0.85,
    browLift: 5,
    lookY: -3,
    tremble: 0.18,
  },
  skeptical: {
    leftOpen: 0.16,
    rightOpen: 0.65,
    width: 0.6,
    brow: 0.8,
    browAngle: 0.06,
    browAsymmetry: -12,
    browLift: 1,
    headTilt: 0.1,
    lookX: -5,
  },
  focused: {
    leftOpen: 0.32,
    rightOpen: 0.32,
    width: 0.68,
    leftAngle: 0.12,
    rightAngle: -0.12,
    brow: 0.4,
    browAngle: 0.15,
    browLift: -4,
    lookY: 1,
  },
  excited: {
    leftOpen: 1.3,
    rightOpen: 1.3,
    width: 0.68,
    smile: 1,
    brow: 0.65,
    browLift: 8,
    bounce: 1.3,
  },
  calm: {
    leftOpen: 0.25,
    rightOpen: 0.25,
    width: 0.62,
    smile: 1,
    leftAngle: -0.1,
    rightAngle: 0.1,
    headTilt: -0.04,
  },
  shy: {
    leftOpen: 0.6,
    rightOpen: 0.6,
    width: 0.3,
    leftAngle: -0.3,
    rightAngle: 0.3,
    lookY: 10,
    lookX: -4,
    headTilt: -0.18,
  },
  confused: {
    leftOpen: 0.45,
    rightOpen: 1.3,
    width: 0.5,
    leftAngle: -0.2,
    rightAngle: 0.14,
    brow: 0.9,
    browAngle: -0.25,
    browAsymmetry: -10,
    browLift: 3,
    headTilt: 0.2,
    lookX: -4,
  },
};

export function mixFace(from: FaceRig, to: FaceRig, progress: number): FaceRig {
  const result = { ...to };
  for (const key of Object.keys(result) as (keyof FaceRig)[])
    result[key] = (from[key] ?? to[key]) + (to[key] - (from[key] ?? to[key])) * progress;
  return result;
}

/** Critically damped motion retains velocity when an expression is interrupted. */
export function easeFace(
  current: FaceRig,
  target: FaceRig,
  velocity: Partial<FaceRig>,
  seconds: number,
): FaceRig {
  const result = { ...target };
  const dt = Math.max(0, Math.min(seconds, 0.064));
  const speed = 16;
  const decay = Math.exp(-speed * dt);
  for (const key of Object.keys(target) as (keyof FaceRig)[]) {
    const delta = (current[key] ?? target[key]) - target[key];
    const v = velocity[key] ?? 0;
    const change = v + speed * delta;
    let next = target[key] + (delta + change * dt) * decay;
    let nextVelocity = (v - speed * change * dt) * decay;
    if (
      ['leftOpen', 'rightOpen', 'width', 'bounce', 'tremble', 'smile', 'brow'].includes(key) &&
      next < 0
    ) {
      next = 0;
      nextVelocity = 0;
    }
    if ((key === 'smile' || key === 'brow') && next > 1) {
      next = 1;
      nextVelocity = 0;
    }
    if (Math.abs(next - target[key]) < 0.0005 && Math.abs(nextVelocity) < 0.005) {
      next = target[key];
      nextVelocity = 0;
    }
    result[key] = next;
    velocity[key] = nextVelocity;
  }
  return result;
}

export function expressionRig(config: AvatarConfig): FaceRig {
  if (config.idle)
    return {
      ...NEUTRAL,
      ...EXPRESSIONS.sleepy,
      leftOpen: 0.1,
      rightOpen: 0.13,
      headTilt: 0.09,
    };
  return mixFace(NEUTRAL, { ...NEUTRAL, ...EXPRESSIONS[config.eyes] }, config.expression / 100);
}
