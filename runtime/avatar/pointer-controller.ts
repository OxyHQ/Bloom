/** Native blue drag observed through the original public Character API.
 * Custom avatars additionally require their gaze and eye attachment controllers.
 * Coordinates are normalized in the uncropped source viewport, not the DOM cell. */
export class AvatarPointerController {
  active = false;
  yaw = 0;
  pitch = 0;
  private startX = 0;
  private startY = 0;
  private released = 0;
  private releaseYaw = 0;
  private releasePitch = 0;

  // Below this angle the tested 512px render is pixel-identical to rest.
  // Stop submitting frames rather than running an asymptotic decay forever.
  get moving() {
    return !this.active && Math.max(Math.abs(this.yaw), Math.abs(this.pitch)) >= 1e-12;
  }

  down(x: number, y: number, time: number) {
    this.sample(time);
    this.startX = Math.fround(x);
    this.startY = Math.fround(y);
    this.active = true;
  }

  move(x: number, y: number) {
    if (!this.active) return;
    const dx = Math.fround(Math.fround(x) - this.startX);
    const dy = Math.fround(Math.fround(y) - this.startY);
    this.yaw = Math.fround(Math.max(-0.32, Math.min(0.32, Math.fround(dx * Math.fround(1.7)))));
    this.pitch = Math.fround(Math.max(-0.22, Math.min(0.22, Math.fround(dy * 1.5))));
  }

  up(time: number) {
    if (!this.active) return;
    this.active = false;
    this.released = time;
    this.releaseYaw = this.yaw;
    this.releasePitch = this.pitch;
  }

  sample(time: number) {
    if (this.active || (!this.releaseYaw && !this.releasePitch)) return;
    const decay = Math.pow(0.88, Math.max(0, time - this.released) * 60);
    this.yaw = this.releaseYaw * decay;
    this.pitch = this.releasePitch * decay;
    if (!this.moving) this.yaw = this.pitch = this.releaseYaw = this.releasePitch = 0;
  }

  reset() {
    this.active = false;
    this.yaw = this.pitch = this.releaseYaw = this.releasePitch = 0;
  }
}
