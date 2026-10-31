import { ComputerLoopSampler } from './computer-loop';
import { AuthoredMotionSampler, type AuthoredMotionClip } from './motion';
import type { AvatarPreset } from './catalog';
import { decodeMotionBinary } from './motion-binary';
import computerReturns from './assets/motion/computer-returns.json';
import { attachEyeBlink, type EyeBlinkDocument } from './eye-blink';
import { attachReactionGaze, type ReactionGazeData } from './reaction-gaze-data';

export type MotionKind = 'idle' | 'reaction' | 'work';
export type MotionSamplers = {
  idle: AuthoredMotionSampler;
  reaction?: AuthoredMotionSampler;
  work?: AuthoredMotionSampler;
  workLoop?: ComputerLoopSampler;
  /** Phase of the independently observed idle at the exact reaction endpoint. */
  reactionReturnTime?: number;
  reactionGaze?: { entryTime: number; coreSeconds: number };
  /** Computer endpoint and independently observed idle phase, in clip seconds. */
  workReturn?: { time: number; idleTime: number };
};
const baseUrls = import.meta.glob('./assets/packed-motion/*.bin', {
  eager: true,
  query: '?url&avatar-motion=base',
  import: 'default',
}) as Record<string, string>;
const workUrls = import.meta.glob('./assets/packed-motion/*.bin', {
  eager: true,
  query: '?url&avatar-motion=work',
  import: 'default',
}) as Record<string, string>;
type MotionBundle = {
  schema: string;
  version: number;
  preset: string;
  motion: {
    preset: string;
    clips: { idle: AuthoredMotionClip; reaction?: AuthoredMotionClip };
    reactionEnd?: 'return-idle' | 'hold';
    evidence?: { idle: { nativeStart: number }; reaction: { nativeEnd: number } };
  };
  computerLoop?: {
    schema: string;
    version: number;
    preset: string;
    nativeStart: number;
    loopStart: number;
    period: number;
    clip: AuthoredMotionClip;
  };
  computer: { schema: string; preset: string; clip: AuthoredMotionClip };
  eyeBlink?: EyeBlinkDocument;
  reactionGaze?: ReactionGazeData;
};
const basePending = new Map<AvatarPreset, Promise<MotionSamplers>>();
const completePending = new Map<AvatarPreset, Promise<MotionSamplers>>();
async function bundleFor(
  preset: AvatarPreset,
  urls: Record<string, string>,
): Promise<MotionBundle> {
  const url = urls[`./assets/packed-motion/${preset}.bin`];
  if (!url) throw Error(`Missing packed avatar motion: ${preset}`);
  const response = await fetch(url);
  if (!response.ok) throw Error(`Avatar motion failed (${response.status}): ${preset}`);
  return decodeMotionBinary(await response.arrayBuffer()) as MotionBundle;
}
/** Optional activity data is requested once, on the first actual work action. */
export function loadAuthoredMotion(
  preset: AvatarPreset,
  activities = true,
): Promise<MotionSamplers> {
  let base = basePending.get(preset);
  if (!base) {
    base = loadBase(preset).catch((error) => {
      basePending.delete(preset);
      throw error;
    });
    basePending.set(preset, base);
  }
  if (!activities) return base;
  let complete = completePending.get(preset);
  if (!complete) {
    complete = Promise.all([base, bundleFor(preset, workUrls)])
      .then(([samplers, bundle]) => addWork(preset, samplers, bundle))
      .catch((error) => {
        completePending.delete(preset);
        throw error;
      });
    completePending.set(preset, complete);
  }
  return complete;
}
// The production rig has solid meshes only. Historical exported clips retain
// strand tracks; avoid allocating/sampling their dead poses in every instance.
const surfaceClip = (clip: AuthoredMotionClip): AuthoredMotionClip => ({
  ...clip,
  parts: clip.parts.filter((part) => !part.id.startsWith('fur:')),
});

async function loadBase(preset: AvatarPreset): Promise<MotionSamplers> {
  const bundle = await bundleFor(preset, baseUrls);
  if (
    bundle.schema !== 'bloom.avatar.motion-bundle' ||
    bundle.version !== 1 ||
    bundle.preset !== preset
  )
    throw Error(`Avatar motion bundle identity mismatch: ${preset}`);
  const { motion: data } = bundle;
  if (data.preset !== preset) throw Error(`Avatar motion identity mismatch: ${preset}`);
  if (preset === 'lime_headphones') {
    if (!bundle.eyeBlink) throw Error('Missing Headphones idle blink');
    attachEyeBlink(data.clips.idle, bundle.eyeBlink, preset);
  }
  if (preset !== 'blue_beret' && (!bundle.reactionGaze || !data.clips.reaction))
    throw Error(`Missing reaction gaze frame: ${preset}`);
  if (preset === 'lime_headphones' && !bundle.reactionGaze?.eyeBlink)
    throw Error('Missing Headphones reaction blink');
  const reactionGaze =
    bundle.reactionGaze && data.clips.reaction
      ? attachReactionGaze(data.clips.reaction, bundle.reactionGaze)
      : undefined;
  const reactionReturnTime =
    data.reactionEnd === 'return-idle' && data.evidence
      ? data.evidence.reaction.nativeEnd - data.evidence.idle.nativeStart
      : undefined;
  if (
    data.reactionEnd === 'return-idle' &&
    (!data.clips.reaction ||
      reactionReturnTime === undefined ||
      !Number.isFinite(reactionReturnTime) ||
      reactionReturnTime < 0 ||
      reactionReturnTime >= data.clips.idle.duration)
  )
    throw Error(`Invalid reaction return phase: ${preset}`);
  return {
    idle: new AuthoredMotionSampler(surfaceClip(data.clips.idle)),
    reaction: data.clips.reaction
      ? new AuthoredMotionSampler(surfaceClip(data.clips.reaction))
      : undefined,
    reactionReturnTime,
    reactionGaze,
  };
}

function addWork(preset: AvatarPreset, base: MotionSamplers, bundle: MotionBundle): MotionSamplers {
  const episode = bundle.computer;
  if (
    bundle.schema !== 'bloom.avatar.motion-bundle' ||
    bundle.version !== 1 ||
    bundle.preset !== preset ||
    episode?.schema !== 'bloom.avatar.computer-motion' ||
    episode.preset !== preset
  )
    throw Error(`Computer motion identity mismatch: ${preset}`);
  const loop = bundle.computerLoop;
  if (
    !loop ||
    loop.schema !== 'bloom.avatar.computer-loop' ||
    loop.version !== 1 ||
    loop.preset !== preset
  )
    throw Error(`Missing or invalid Computer loop: ${preset}`);
  const workLoop = new ComputerLoopSampler(
    surfaceClip(loop.clip),
    loop.nativeStart,
    loop.loopStart,
    loop.period,
  );
  const work = new AuthoredMotionSampler(surfaceClip(episode.clip));
  const workReturn = (
    computerReturns.presets as Partial<
      Record<AvatarPreset, { returnTime: number; idleTime: number }>
    >
  )[preset];
  if (!workReturn) throw Error(`Missing verified Computer return: ${preset}`);
  if (
    !Number.isFinite(workReturn.returnTime) ||
    !Number.isFinite(workReturn.idleTime) ||
    workReturn.returnTime <= 0 ||
    workReturn.returnTime > episode.clip.duration ||
    workReturn.idleTime < 0 ||
    workReturn.idleTime >= base.idle.clip.duration
  )
    throw Error(`Invalid Computer return phase: ${preset}`);
  return {
    ...base,
    work,
    workLoop,
    workReturn: { time: workReturn.returnTime, idleTime: workReturn.idleTime },
  };
}
