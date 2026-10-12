import type { AuthoredMotionClip, MotionValues } from './motion';

export type EyeBlinkDocument = {
  schema: string;
  version: number;
  preset: string;
  clips: { idle: { duration: number; times: MotionValues; samples: MotionValues } };
};

/** Attach the independently observed scalar to its own preset's existing clock.
 * The sampler carries four-wide semantic fields; this never reaches a shader.
 * Captured expression channels stay intact, including Headphones' hidden blink. */
export function attachEyeBlink(
  clip: AuthoredMotionClip,
  document: EyeBlinkDocument,
  preset: string,
) {
  const blink = document.clips.idle;
  if (
    document.schema !== 'bloom.authored-hidden-eye-blink' ||
    document.version !== 1 ||
    document.preset !== preset ||
    blink.duration !== clip.duration ||
    blink.times.length !== clip.times.length ||
    blink.samples.length !== clip.times.length ||
    !blink.times.every((t, i) => t === clip.times[i]) ||
    !blink.samples.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)
  )
    throw Error('Eye blink must match the observed preset and motion clock');
  const body = clip.parts.find((part) => part.id === 'mesh:0');
  if (!body || body.fields.eyeBlink) throw Error('Eye blink requires an unmodified body channel');
  const samples = new Float64Array(blink.samples.length * 4);
  blink.samples.forEach((value, i) => {
    samples[i * 4] = value;
  });
  body.fields.eyeBlink = { samples };
}
