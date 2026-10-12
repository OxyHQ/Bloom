/** Semantic animation sampler. Own a separate output pose per avatar. */
import * as THREE from 'three';

export type MotionValues = number[] | Float64Array;
export type MotionChannel = { value: MotionValues } | { samples: MotionValues };
export type AuthoredMotionClip = {
  duration: number;
  loop: boolean;
  times: MotionValues;
  parts: {
    id: string;
    translation: MotionChannel;
    rotation: MotionChannel;
    scale: MotionChannel;
    /** QR upper-triangular coefficients [xy, xz, yz], in world units.
     * world.linear = rotation * [[sx,xy,xz],[0,sy,yz],[0,0,sz]]. */
    shear?: MotionChannel;
    /** Column-major 3x3 correction to inverse-transpose(world.linear).
     * Retains the native normal basis, including its floating-point residual. */
    normalCorrection?: MotionChannel;
    fields: Record<string, MotionChannel>;
  }[];
};
export type AuthoredMotionPose = {
  id: string;
  world: THREE.Matrix4;
  normalMatrix: THREE.Matrix4;
  fields: Record<string, number[]>;
};

function interpolate(
  channel: MotionChannel,
  width: number,
  out: number[],
  lo: number,
  hi: number,
  alpha: number,
) {
  if ('value' in channel) {
    for (let k = 0; k < width; k++) out[k] = channel.value[k]!;
    return;
  }
  for (let k = 0; k < width; k++) {
    const a = channel.samples[lo * width + k]!;
    const b = channel.samples[hi * width + k]!;
    out[k] = alpha === 0 ? a : alpha === 1 ? b : a + (b - a) * alpha;
  }
}

export class AuthoredMotionSampler {
  private position = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private nextRotation = new THREE.Quaternion();
  private scale = new THREE.Vector3();
  private scratch = [0, 0, 0, 0];
  private shear = [0, 0, 0];
  private normalCorrection = Array<number>(9).fill(0);
  private fieldEntries: [string, MotionChannel][][];

  constructor(readonly clip: AuthoredMotionClip) {
    if (
      !Number.isFinite(clip.duration) ||
      clip.duration <= 0 ||
      clip.times.length < 2 ||
      clip.times[0] !== 0 ||
      clip.times[clip.times.length - 1] !== clip.duration
    )
      throw Error('Invalid authored motion duration');
    for (let i = 1; i < clip.times.length; i++)
      if (clip.times[i]! <= clip.times[i - 1]!) throw Error('Motion keyframes must increase');
    if (!clip.times.every(Number.isFinite)) throw Error('Invalid motion timestamps');
    this.fieldEntries = clip.parts.map((part) => Object.entries(part.fields));
    const ids = new Set<string>();
    for (const part of clip.parts) {
      if (ids.has(part.id)) throw Error('Duplicate motion part');
      ids.add(part.id);
      for (const [channel, width] of [
        [part.translation, 3],
        [part.rotation, 4],
        [part.scale, 3],
        ...(part.shear ? [[part.shear, 3]] : []),
        ...(part.normalCorrection ? [[part.normalCorrection, 9]] : []),
        ...Object.values(part.fields).map((c) => [c, 4]),
      ] as [MotionChannel, number][]) {
        const values = 'value' in channel ? channel.value : channel.samples;
        if (
          values.length !== width * ('value' in channel ? 1 : clip.times.length) ||
          !values.every(Number.isFinite)
        )
          throw Error('Invalid motion channel');
      }
      const scales = 'value' in part.scale ? part.scale.value : part.scale.samples;
      for (let k = 0; k < scales.length; k++) {
        if (Math.abs(scales[k]!) <= 1e-10) throw Error('Singular motion scale');
        if (Math.sign(scales[k]!) !== Math.sign(scales[k % 3]!))
          throw Error('Motion scale crosses a singularity');
        if (part.shear && k % 3 < 2 && scales[k]! < 0)
          throw Error('Affine QR requires positive first two scales');
      }
      const rotations = 'value' in part.rotation ? part.rotation.value : part.rotation.samples;
      for (let k = 0; k < rotations.length; k += 4)
        if (Math.abs(Math.hypot(...rotations.slice(k, k + 4)) - 1) > 1e-6)
          throw Error('Motion rotation must be a unit quaternion');
    }
  }

  createPose(): AuthoredMotionPose[] {
    return this.clip.parts.map((part) => ({
      id: part.id,
      world: new THREE.Matrix4(),
      normalMatrix: new THREE.Matrix4(),
      fields: Object.fromEntries(Object.keys(part.fields).map((key) => [key, [0, 0, 0, 0]])),
    }));
  }

  sample(seconds: number, pose: AuthoredMotionPose[]): void {
    if (!Number.isFinite(seconds) || pose.length !== this.clip.parts.length)
      throw Error('Invalid motion sampling input');
    const { clip } = this;
    const time = clip.loop
      ? ((seconds % clip.duration) + clip.duration) % clip.duration
      : Math.max(0, Math.min(seconds, clip.duration));
    let lo = 0,
      hi = clip.times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (clip.times[mid]! <= time) lo = mid;
      else hi = mid;
    }
    // Wrapping a clock can move an exact keyframe by a few ULPs. Snap only
    // that arithmetic noise, otherwise absent parts acquire tiny visibility.
    const lowerTime = clip.times[lo]!,
      upperTime = clip.times[hi]!;
    const tolerance =
      8 * Number.EPSILON * Math.max(1, Math.abs(time), Math.abs(lowerTime), Math.abs(upperTime));
    const alpha =
      time - lowerTime <= tolerance
        ? 0
        : upperTime - time <= tolerance
          ? 1
          : (time - lowerTime) / (upperTime - lowerTime);
    for (let i = 0; i < clip.parts.length; i++) {
      const part = clip.parts[i]!,
        target = pose[i]!;
      if (target.id !== part.id) throw Error('Motion pose identities differ');
      interpolate(part.translation, 3, this.scratch, lo, hi, alpha);
      this.position.fromArray(this.scratch);
      interpolate(part.scale, 3, this.scratch, lo, hi, alpha);
      this.scale.fromArray(this.scratch);
      if ('value' in part.rotation) this.rotation.fromArray(part.rotation.value);
      else {
        this.rotation.fromArray(part.rotation.samples, lo * 4);
        this.nextRotation.fromArray(part.rotation.samples, hi * 4);
        if (alpha === 1) this.rotation.copy(this.nextRotation);
        else if (alpha !== 0) this.rotation.slerp(this.nextRotation, alpha);
      }
      if (part.shear) {
        interpolate(part.shear, 3, this.shear, lo, hi, alpha);
        target.world.makeRotationFromQuaternion(this.rotation).setPosition(this.position);
        const e = target.world.elements;
        for (let row = 0; row < 3; row++) {
          const x = e[row]!,
            y = e[4 + row]!,
            z = e[8 + row]!;
          e[row] = x * this.scale.x;
          e[4 + row] = x * this.shear[0]! + y * this.scale.y;
          e[8 + row] = x * this.shear[1]! + y * this.shear[2]! + z * this.scale.z;
        }
      } else target.world.compose(this.position, this.rotation, this.scale);
      // Nonuniform eye squash requires inverse transpose, not a rigid delta.
      target.normalMatrix.copy(target.world).invert().transpose();
      if (part.normalCorrection) {
        interpolate(part.normalCorrection, 9, this.normalCorrection, lo, hi, alpha);
        const e = target.normalMatrix.elements;
        for (let column = 0; column < 3; column++)
          for (let row = 0; row < 3; row++)
            e[column * 4 + row] = e[column * 4 + row]! + this.normalCorrection[column * 3 + row]!;
        // Native normal bases are homogeneous direction transforms. Translation
        // contributes to inverse-transpose(mat4)'s last row, but not to normals.
        e[3] = e[7] = e[11] = e[12] = e[13] = e[14] = 0;
        e[15] = 1;
      }
      for (const [key, channel] of this.fieldEntries[i]!)
        interpolate(channel, 4, target.fields[key]!, lo, hi, alpha);
    }
  }
}
