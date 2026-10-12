import { Matrix4 } from 'three';

export interface EyeGazeProfile {
  anchor: [number, number, number];
  halfSize: [number, number];
  angularGain: [number, number];
  translationGain: [number, number];
  blink: 'integrated' | 'linear' | 'external';
  blinkMultiplier: number;
  /** Flat catalog eyes follow their authored quadratic face surface. */
  surface?: {
    curvature: [number, number];
    slope: [number, number];
    crossCurvature?: number;
  };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => value * value * (3 - 2 * value);
const inverseSmooth = (value: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(value)) / 3);

/** Recover the scalar closure from the two native half-range morph channels.
 * Headphones' permanently closed eyelid morphs do not expose this state: their
 * hidden blink must be supplied separately, never guessed from [0, 1]. */
export function eyeClosureFromMorph(
  parameters: ArrayLike<number>,
  encoding: 'integrated' | 'linear',
) {
  const first = parameters[2];
  const second = parameters[3];
  if (
    typeof first !== 'number' ||
    typeof second !== 'number' ||
    !Number.isFinite(first) ||
    !Number.isFinite(second)
  )
    throw new Error('Invalid eye morph channels');
  const inverse = encoding === 'integrated' ? inverseSmooth : clamp01;
  return second > 0 ? (1 + inverse(second)) / 2 : inverse(first) / 2;
}

/** Independent eye spring observed at 30/60 Hz through public native input.
 * Advance/present ordering matches AvatarGazeController; coordinates are in
 * the uncropped source viewport. This owns no renderer, timer or native state. */
export class AvatarEyeGazeController {
  x = 0;
  y = 0;
  private velocityX = 0;
  private velocityY = 0;
  private targetX = 0;
  private targetY = 0;
  private inverseRelativePose = new Matrix4();

  get moving() {
    return (
      Math.max(
        Math.abs(this.x - this.targetX),
        Math.abs(this.y - this.targetY),
        Math.abs(this.velocityX),
        Math.abs(this.velocityY),
      ) >= 1e-12
    );
  }

  point(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid eye coordinates');
    this.targetX = clamp01(Math.fround(x)) - 0.5;
    this.targetY = clamp01(Math.fround(y)) - 0.5;
  }

  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid eye interval');
    if (!this.moving) return;
    const decay = Math.exp(-55 * seconds);
    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    const jx = this.velocityX + 55 * dx;
    const jy = this.velocityY + 55 * dy;
    this.x = this.targetX + (dx + jx * seconds) * decay;
    this.y = this.targetY + (dy + jy * seconds) * decay;
    this.velocityX = (this.velocityX - 55 * jx * seconds) * decay;
    this.velocityY = (this.velocityY - 55 * jy * seconds) * decay;
    if (!this.moving) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.velocityX = this.velocityY = 0;
    }
  }

  /** Postmultiply both outputs onto the existing part pose, AFTER body motion.
   * Preserving the supplied blink pose also preserves its local depth shift.
   * Native gaze projects the rotation onto XY while retaining the original Z;
   * using a rigid rotation here visibly changes the authored eye surface. */
  writeCorrection(
    profile: EyeGazeProfile,
    blinkClosure: number,
    world: Matrix4,
    normal: Matrix4,
    strength = 1,
  ) {
    if (!Number.isFinite(blinkClosure) || blinkClosure < 0 || blinkClosure > 1)
      throw new Error('A measured eye blink closure in [0, 1] is required');
    if (!Number.isFinite(strength) || strength < 0 || strength > 1)
      throw new Error('Eye transition strength must be in [0, 1]');
    const openness = (1 - smooth(clamp01(blinkClosure * profile.blinkMultiplier))) * strength;
    if (openness === 0 || (this.x === 0 && this.y === 0)) {
      world.identity();
      normal.identity();
      return;
    }
    const yaw = this.x * profile.angularGain[0] * openness;
    const pitch = this.y * profile.angularGain[1] * openness;
    const cx = Math.cos(yaw),
      sx = Math.sin(yaw);
    const cy = Math.cos(pitch),
      sy = Math.sin(pitch);
    const ox = this.x * profile.halfSize[0] * profile.translationGain[0] * openness;
    const oy = this.y * profile.halfSize[1] * profile.translationGain[1] * openness;
    const [px, py, pz] = profile.anchor;
    if (profile.surface) {
      const [ax, ay] = profile.surface.curvature;
      const [bx, by] = profile.surface.slope;
      const cross = profile.surface.crossCurvature ?? 0;
      const xy = sx * sy;
      const zx = cx * (bx - ax * ox - cross * oy) - bx;
      const zy = xy * (bx - ax * ox - cross * oy) + cy * (by - ay * oy - cross * ox) - by;
      const depth = bx * ox + by * oy - (ax * ox * ox + ay * oy * oy + 2 * cross * ox * oy) / 2;
      world.set(
        cx,
        xy,
        0,
        px * (1 - cx) - py * xy + ox,
        0,
        cy,
        0,
        py * (1 - cy) + oy,
        zx,
        zy,
        1,
        depth - zx * px - zy * py,
        0,
        0,
        0,
        1,
      );
      normal.copy(world).setPosition(0, 0, 0).invert().transpose();
      return;
    }
    world.set(
      cx,
      sx * sy,
      sx * cy,
      px * (1 - cx) - py * sx * sy - pz * sx * cy + ox,
      0,
      cy,
      -sy,
      py * (1 - cy) + pz * sy + oy,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    );
    normal.copy(world).setPosition(0, 0, 0).invert().transpose();
  }

  /** Compose projected gaze BEFORE an existing expression pose. Convert that
   * correction to the postmultiply contract of writeCorrection. relativePose
   * is inverse(neutralFrame) * eyeWorld; ReactionGazeComposer constructs that
   * frame without confusing reaction translation with breathing translation.
   * Ordinary idle blink depth uses writeCorrection instead.
   */
  writeBeforePoseCorrection(
    profile: EyeGazeProfile,
    blinkClosure: number,
    relativePose: Matrix4,
    world: Matrix4,
    normal: Matrix4,
    strength = 1,
  ) {
    if (
      !Number.isFinite(relativePose.determinant()) ||
      Math.abs(relativePose.determinant()) < 1e-12
    )
      throw new Error('Eye expression pose must be invertible');
    this.writeCorrection(profile, blinkClosure, world, normal, strength);
    this.inverseRelativePose.copy(relativePose).invert();
    world.premultiply(this.inverseRelativePose).multiply(relativePose);
    normal.copy(world).setPosition(0, 0, 0).invert().transpose();
  }

  reset() {
    this.x = this.y = this.velocityX = this.velocityY = this.targetX = this.targetY = 0;
  }
}
