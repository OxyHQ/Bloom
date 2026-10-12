import type { AuthoredMotionClip, MotionValues } from './motion';

export type ReactionGazeData = {
  entryTime: number;
  coreSeconds: number;
  duration: number;
  times: MotionValues;
  translation: MotionValues;
  scale: MotionValues;
  eyeBlink?: MotionValues;
};

/** The neutral frame belongs to the captured reaction's clock. It contains no
 * pointer input, allowing every instance to follow its own live target. */
export function attachReactionGaze(clip: AuthoredMotionClip, data: ReactionGazeData) {
  if (
    !Number.isFinite(data.entryTime) ||
    data.entryTime < 0 ||
    !Number.isFinite(data.coreSeconds) ||
    data.coreSeconds <= 0.18 ||
    data.entryTime + data.coreSeconds >= clip.duration ||
    data.duration !== clip.duration ||
    data.times.length !== clip.times.length ||
    !data.times.every((time, index) => time === clip.times[index]) ||
    data.translation.length !== clip.times.length * 4 ||
    data.scale.length !== clip.times.length * 4 ||
    !data.translation.every(Number.isFinite) ||
    !data.scale.every((v, i) => Number.isFinite(v) && (i % 4 === 3 || v > 0))
  )
    throw Error('Reaction gaze must match the observed motion clock and neutral frame');
  if (
    data.eyeBlink &&
    (data.eyeBlink.length !== clip.times.length * 4 ||
      !data.eyeBlink.every((v) => Number.isFinite(v) && v >= 0 && v <= 1))
  )
    throw Error('Reaction blink must match the observed motion clock');
  const body = clip.parts.find((part) => part.id === 'mesh:0');
  if (
    !body ||
    body.fields.gazeNeutralTranslation ||
    body.fields.gazeNeutralScale ||
    body.fields.eyeBlink
  )
    throw Error('Reaction gaze requires an unmodified body channel');
  body.fields.gazeNeutralTranslation = { samples: data.translation };
  body.fields.gazeNeutralScale = { samples: data.scale };
  if (data.eyeBlink) body.fields.eyeBlink = { samples: data.eyeBlink };
  return { entryTime: data.entryTime, coreSeconds: data.coreSeconds };
}
