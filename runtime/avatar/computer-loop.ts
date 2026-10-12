import { Matrix4 } from 'three';
import { AvatarBreathing } from './breathing';
import { AuthoredMotionSampler, type AuthoredMotionClip, type AuthoredMotionPose } from './motion';

/** Repeating authored Computer actions retain their independent breathing clock.
 * The cycle's props/topology are native-observed; no whole-body loop or raster
 * cache is used. Start/Stop transitions belong to the activity controller. */
export class ComputerLoopSampler extends AuthoredMotionSampler {
  private breathing = new AvatarBreathing();
  private sourceBreath = { y: 0, scaleY: 1, scaleXZ: 1 };
  private targetBreath = { y: 0, scaleY: 1, scaleXZ: 1 };
  private delta = new Matrix4();
  private normalDelta = new Matrix4();
  private scaleDelta = new Matrix4();
  private inverseBody = new Matrix4();
  constructor(
    clip: AuthoredMotionClip,
    readonly nativeStart: number,
    readonly loopStart = 1,
    readonly period = 6,
  ) {
    super(clip);
    if (
      !Number.isFinite(nativeStart) ||
      !Number.isFinite(loopStart) ||
      !Number.isFinite(period) ||
      nativeStart < 1 / 60 ||
      loopStart < 0 ||
      period <= 0 ||
      clip.duration < loopStart + period
    )
      throw Error('Computer loop requires its complete observed interval');
  }
  override sample(seconds: number, pose: AuthoredMotionPose[]) {
    if (!Number.isFinite(seconds) || seconds < 0) throw Error('Invalid Computer loop time');
    const sourceTime =
      seconds < this.loopStart
        ? seconds
        : this.loopStart + ((seconds - this.loopStart) % this.period);
    super.sample(sourceTime, pose);
    if (sourceTime === seconds) return;
    this.breathing.sample(this.nativeStart + sourceTime - 1 / 60, this.sourceBreath, false);
    this.breathing.sample(this.nativeStart + seconds - 1 / 60, this.targetBreath, false);
    const x = this.targetBreath.scaleXZ / this.sourceBreath.scaleXZ;
    const y = this.targetBreath.scaleY / this.sourceBreath.scaleY;
    const body = pose[0];
    if (body?.id !== 'mesh:0') throw Error('Computer loop requires its body frame');
    this.inverseBody.copy(body.world).invert();
    this.delta.copy(body.world).multiply(this.scaleDelta.makeScale(x, y, x));
    this.delta.elements[13]! += this.targetBreath.y - this.sourceBreath.y;
    this.delta.multiply(this.inverseBody);
    this.normalDelta.copy(this.delta).invert().transpose();
    this.normalDelta.elements[3] = this.normalDelta.elements[7] = this.normalDelta.elements[11] = 0;
    this.normalDelta.setPosition(0, 0, 0);
    for (const part of pose) {
      const kind = part.fields.referencePose?.[3];
      if (kind === -4 || kind === -24 || kind === -40) continue;
      if (kind === -16) {
        part.world.multiply(this.scaleDelta.makeScale(x, x, 1));
        part.normalMatrix.multiply(this.scaleDelta.makeScale(1 / x, 1 / x, 1));
      } else {
        part.world.premultiply(this.delta);
        part.normalMatrix.premultiply(this.normalDelta);
      }
    }
  }
}
