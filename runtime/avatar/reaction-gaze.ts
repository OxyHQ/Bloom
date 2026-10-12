import { Matrix4 } from 'three';
import type {
  AvatarEyeGazeController,
  EyeGazeProfile,
} from './eye-gaze-controller';

export type ReactionNeutralVector = ArrayLike<number>;
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (10 - 15 * t + 6 * t * t);
};

/** Time zero is the observed native transition origin, NOT command dispatch.
 * Runtime adapter and direct Character captures have different presentation
 * offsets. The caller must supply the metadata for its source clip. */
export function reactionGazeEnvelope(seconds: number, coreSeconds: number) {
  if (
    !Number.isFinite(seconds) ||
    !Number.isFinite(coreSeconds) ||
    coreSeconds < 0.18
  )
    throw new Error('Invalid reaction gaze interval');
  return {
    frozen: seconds < coreSeconds,
    strength:
      seconds < coreSeconds
        ? 1 - smooth(seconds / 0.18)
        : smooth((seconds - coreSeconds) / 0.18),
  };
}

function vector(values: ReactionNeutralVector, positive = false) {
  for (let index = 0; index < 3; index++) {
    const value = values[index];
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (positive && value <= 0)
    )
      throw new Error('Invalid reaction neutral frame');
  }
}

/** Pure matrix composition; owns no clock, renderer or source-engine state.
 * neutralTranslation is the already weighted breathing translation: frozen
 * incoming idle on entry, live paired idle on exit. neutralScale is the scale
 * of the CURRENT sampled reaction body, including its breathing deformation.
 * Eye projection precedes reaction expression in this neutral frame; blindly
 * conjugating by inverse(bodyWorld)*eyeWorld rotates the projection incorrectly.
 */
export class ReactionGazeComposer {
  private basis = new Matrix4().makeRotationY((8 * Math.PI) / 180);
  private inverseBasis = this.basis.clone().invert();
  private scratch = new Matrix4();
  private relativeEye = new Matrix4();

  writeBodyCorrection(
    yaw: number,
    pitch: number,
    neutralTranslation: ReactionNeutralVector,
    world: Matrix4,
    normal: Matrix4,
  ) {
    vector(neutralTranslation);
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch))
      throw new Error('Invalid reaction gaze angles');
    normal
      .copy(this.basis)
      .multiply(this.scratch.makeRotationY(yaw))
      .multiply(this.scratch.makeRotationX(pitch))
      .multiply(this.inverseBasis);
    const x = neutralTranslation[0]!,
      y = neutralTranslation[1]!,
      z = neutralTranslation[2]!;
    world
      .makeTranslation(x, y, z)
      .multiply(normal)
      .multiply(this.scratch.makeTranslation(-x, -y, -z));
  }

  writeNeutralFrame(
    neutralTranslation: ReactionNeutralVector,
    neutralScale: ReactionNeutralVector,
    output: Matrix4,
  ) {
    vector(neutralTranslation);
    vector(neutralScale, true);
    output
      .copy(this.basis)
      .multiply(
        this.scratch.makeScale(
          neutralScale[0]!,
          neutralScale[1]!,
          neutralScale[2]!,
        ),
      );
    output.setPosition(
      neutralTranslation[0]!,
      neutralTranslation[1]!,
      neutralTranslation[2]!,
    );
  }

  writeEyeCorrection(
    eyes: AvatarEyeGazeController,
    profile: EyeGazeProfile,
    closure: number,
    strength: number,
    neutralTranslation: ReactionNeutralVector,
    neutralScale: ReactionNeutralVector,
    originalPartWorld: Matrix4,
    world: Matrix4,
    normal: Matrix4,
  ) {
    this.writeNeutralFrame(neutralTranslation, neutralScale, this.relativeEye);
    this.relativeEye.invert().multiply(originalPartWorld);
    eyes.writeBeforePoseCorrection(
      profile,
      closure,
      this.relativeEye,
      world,
      normal,
      strength,
    );
  }
}
