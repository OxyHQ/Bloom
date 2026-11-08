import { resolveAvatarCharacter, type AvatarCharacter } from './character';
import { composeVectorCharacter } from './vector-compose';
import { vectorAssetLoader } from './vector-assets';
import { renderVectorFrame } from './vector-frame';
import type { VectorFrame } from './vector-types';

const frames = new Map<string, VectorFrame>();
const pending = new Map<string, Promise<VectorFrame>>();
export const vectorPortraitKey = (character: AvatarCharacter) =>
  JSON.stringify(resolveAvatarCharacter(character));
export const peekVectorPortrait = (key: string) => frames.get(key);
/** A shared resolution-independent SVG frame, with no animation clock or persistent raster. */
export function loadVectorPortrait(character: AvatarCharacter): Promise<VectorFrame> {
  const key = vectorPortraitKey(character);
  const frame = frames.get(key);
  if (frame) return Promise.resolve(frame);
  const existing = pending.get(key);
  if (existing) return existing;
  const result = composeVectorCharacter(resolveAvatarCharacter(character), vectorAssetLoader)
    .then((asset) => {
      const frame = renderVectorFrame(asset, { action: 'idle', time: 0 });
      frames.set(key, frame);
      if (frames.size > 128) frames.delete(frames.keys().next().value!);
      return frame;
    })
    .finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}
