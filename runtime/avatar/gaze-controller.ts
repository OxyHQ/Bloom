/** Body hover observed in the seven custom native presets. Blue has no hover.
 * Coordinates belong to the original, uncropped viewport. The native spring
 * follows input with a one-presentation delay; callers own presentation timing.
 * Eye attachment projection is intentionally not implemented here.
 */
export class AvatarGazeController {
  yaw = 0;
  pitch = 0;
  private yawVelocity = 0;
  private pitchVelocity = 0;
  private targetYaw = 0;
  private targetPitch = 0;

  get moving() {
    return (
      Math.max(
        Math.abs(this.yaw - this.targetYaw),
        Math.abs(this.pitch - this.targetPitch),
        Math.abs(this.yawVelocity),
        Math.abs(this.pitchVelocity),
      ) >= 1e-12
    );
  }

  point(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid gaze coordinates');
    this.targetYaw = (Math.max(0, Math.min(1, Math.fround(x))) - 0.5) * 0.11;
    this.targetPitch = (Math.max(0, Math.min(1, Math.fround(y))) - 0.5) * 0.07;
  }

  /** Exact solution of x'' + 44 x' + 484 (x - target) = 0. */
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid gaze interval');
    if (!this.moving) return;
    const decay = Math.exp(-22 * seconds);
    const yawDelta = this.yaw - this.targetYaw;
    const pitchDelta = this.pitch - this.targetPitch;
    const yawImpulse = this.yawVelocity + 22 * yawDelta;
    const pitchImpulse = this.pitchVelocity + 22 * pitchDelta;
    this.yaw = this.targetYaw + (yawDelta + yawImpulse * seconds) * decay;
    this.pitch = this.targetPitch + (pitchDelta + pitchImpulse * seconds) * decay;
    this.yawVelocity = (this.yawVelocity - 22 * yawImpulse * seconds) * decay;
    this.pitchVelocity = (this.pitchVelocity - 22 * pitchImpulse * seconds) * decay;
    if (!this.moving) {
      this.yaw = this.targetYaw;
      this.pitch = this.targetPitch;
      this.yawVelocity = this.pitchVelocity = 0;
    }
  }

  reset() {
    this.yaw = this.pitch = this.yawVelocity = this.pitchVelocity = 0;
    this.targetYaw = this.targetPitch = 0;
  }
}
