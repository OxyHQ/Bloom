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
const urls = import.meta.glob('./assets/packed-motion/*.bin', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const pending = new Map<AvatarPreset, Promise<MotionSamplers | null>>();
export function loadAuthoredMotion(preset: AvatarPreset): Promise<MotionSamplers | null> {
  let result = pending.get(preset);
  if (!result) {
    result = loadMotion(preset).catch((error) => {
      pending.delete(preset);
      throw error;
    });
    pending.set(preset, result);
  }
  return result;
}
async function loadMotion(preset: AvatarPreset): Promise<MotionSamplers | null> {
  const url = urls[`./assets/packed-motion/${preset}.bin`];
  if (!url) throw Error(`Missing packed avatar motion: ${preset}`);
  const response = await fetch(url);
  if (!response.ok) throw Error(`Avatar motion failed (${response.status}): ${preset}`);
  const bundle = decodeMotionBinary(await response.arrayBuffer()) as {
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
  if (
    bundle.schema !== 'bloom.avatar.motion-bundle' ||
    bundle.version !== 1 ||
    bundle.preset !== preset
  )
    throw Error(`Avatar motion bundle identity mismatch: ${preset}`);
  const { motion: data, computer: episode } = bundle;
  if (data.preset !== preset) throw Error(`Avatar motion identity mismatch: ${preset}`);
  if (episode.schema !== 'bloom.avatar.computer-motion' || episode.preset !== preset)
    throw Error(`Computer motion identity mismatch: ${preset}`);
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
  const loop = bundle.computerLoop;
  if (
    !loop ||
    loop.schema !== 'bloom.avatar.computer-loop' ||
    loop.version !== 1 ||
    loop.preset !== preset
  )
    throw Error(`Missing or invalid Computer loop: ${preset}`);
  // The production rig has solid meshes only. Historical exported clips retain
  // strand tracks; avoid allocating/sampling their dead poses in every instance.
  const surfaceClip = (clip: AuthoredMotionClip): AuthoredMotionClip => ({
    ...clip,
    parts: clip.parts.filter((part) => !part.id.startsWith('fur:')),
  });
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
    workReturn.idleTime >= data.clips.idle.duration
  )
    throw Error(`Invalid Computer return phase: ${preset}`);
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
    work,
    workLoop,
    workReturn: { time: workReturn.returnTime, idleTime: workReturn.idleTime },
    reactionReturnTime,
    reactionGaze,
  };
}
