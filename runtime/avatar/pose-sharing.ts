import type { AuthoredMotionPose, AuthoredMotionSampler } from './motion';

type Sample = {
  frame: number;
  time: number;
  count: number;
  sampledFrame: number;
  pose?: AuthoredMotionPose[];
};

/** Share only an exactly matching clock within one frame. Each sampler keeps
 * one private reusable output, never a time history or another avatar's pose.
 * Counting first avoids an extra full-pose copy for independent clocks. */
export class AvatarPoseSharing {
  private samples = new WeakMap<AuthoredMotionSampler, Sample>();
  private frame = 0;
  evaluations = 0;
  copies = 0;

  beginFrame() {
    this.frame++;
    this.evaluations = this.copies = 0;
  }

  register(sampler: AuthoredMotionSampler, time: number) {
    let sample = this.samples.get(sampler);
    if (!sample) {
      sample = { frame: this.frame, time, count: 1, sampledFrame: -1 };
      this.samples.set(sampler, sample);
    } else if (sample.frame !== this.frame) {
      sample.frame = this.frame;
      sample.time = time;
      sample.count = 1;
    } else if (sample.time === time) sample.count++;
  }

  sample(sampler: AuthoredMotionSampler, time: number, target: AuthoredMotionPose[]) {
    const sample = this.samples.get(sampler);
    if (!sample || sample.frame !== this.frame || sample.time !== time || sample.count < 2) {
      this.evaluations++;
      sampler.sample(time, target);
      return;
    }
    if (sample.sampledFrame !== this.frame) {
      sample.pose ??= sampler.createPose();
      sampler.sample(time, sample.pose);
      sample.sampledFrame = this.frame;
      this.evaluations++;
    }
    const source = sample.pose!;
    if (source.length !== target.length) throw Error('Invalid shared motion output');
    for (let i = 0; i < source.length; i++) {
      const input = source[i]!,
        output = target[i]!;
      if (input.id !== output.id) throw Error('Shared motion pose identities differ');
      output.world.copy(input.world);
      output.normalMatrix.copy(input.normalMatrix);
      for (const key in input.fields) {
        const values = input.fields[key]!,
          destination = output.fields[key]!;
        for (let k = 0; k < values.length; k++) destination[k] = values[k]!;
      }
    }
    this.copies++;
  }
}
