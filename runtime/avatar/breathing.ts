/** Independent breathing clock. The original interactive and activity controllers
 * evaluate the same curve with different arithmetic precision. Keep both paths:
 * f32 rounding at only the final matrix does not reproduce the interactive pose. */
export type BreathingPose = { y: number; scaleY: number; scaleXZ: number };
const f = Math.fround;
function randomUnit(seed: number) {
  let n = Math.imul(seed ^ (seed >>> 16), 2146121005);
  n = Math.imul(n ^ (n >>> 15), -2073254261);
  return ((n >>> 24) ^ (n >>> 8)) / 16777216;
}
function smooth(t: number, interactive: boolean) {
  if (!interactive) return t * t * t * (t * (t * 6 - 15) + 10);
  t = f(t);
  return f(f(f(t * t) * t) * f(f(t * f(f(t * 6) - 15)) + 10));
}
export class AvatarBreathing {
  readonly period: number;
  readonly phase: number;
  constructor(seed = 17) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw Error('Breathing seed must be an unsigned 32-bit integer');
    this.period = 5.2 + 0.8 * randomUnit(seed ^ 599040221);
    this.phase = randomUnit(seed);
  }
  /** Supply animation time, not presentation time. The captured adapter presents
   * the preceding 60 Hz pose; that offset belongs to the capture, not this clock. */
  sample(seconds: number, output: BreathingPose, interactive = true) {
    if (!Number.isFinite(seconds) || seconds < 0) throw Error('Invalid breathing time');
    const u = (seconds / this.period + this.phase) % 1;
    let v =
      u < 0.4
        ? smooth(u / 0.4, interactive) - 0.5
        : u < 0.47
          ? 0.5
          : u < 0.91
            ? 0.5 - smooth((u - 0.47) / 0.44, interactive)
            : -0.5;
    if (interactive) {
      v = f(v);
      output.y = f(v * f(0.002));
      output.scaleY = f(f(v * f(0.006)) + 1);
      output.scaleXZ = f(1 / f(Math.sqrt(output.scaleY)));
    } else {
      output.y = f(v * 0.002);
      const scaleY = v * 0.006 + 1;
      output.scaleY = f(scaleY);
      output.scaleXZ = f(1 / Math.sqrt(scaleY));
    }
    return output;
  }
}
