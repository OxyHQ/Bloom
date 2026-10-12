/** Local review fixtures stay separate from the runtime animation catalog. */
import { AuthoredAvatarEngine } from './authored-engine';
import { loadAuthoredAsset, type AuthoredAsset, type AvatarPreset } from './catalog';
import { AuthoredMotionSampler, type AuthoredMotionClip } from './motion';

export type ObservationReview = {
  schema: 'bloom.avatar.observation-review';
  preset: AvatarPreset;
  name: 'idle' | 'reaction';
  clip: AuthoredMotionClip & { endSemantics: 'observation-boundary' };
  material: AuthoredAsset['material'];
  checkpoints: { time: number; requested: number; frameIndex: number; image: string }[];
};

export async function loadObservationReview(preset: AvatarPreset, name: 'idle' | 'reaction') {
  const response = await fetch(`/.local/avatar-motion-review/${preset}/${name}.json`);
  if (!response.ok) throw Error('La captura local todavía no está disponible.');
  const data = (await response.json()) as ObservationReview;
  if (
    data.schema !== 'bloom.avatar.observation-review' ||
    data.preset !== preset ||
    data.name !== name ||
    data.clip.loop ||
    data.clip.endSemantics !== 'observation-boundary'
  )
    throw Error('Invalid finite observation fixture');
  return data;
}

export function createObservationReview(canvas: HTMLCanvasElement, data: ObservationReview) {
  const sampler = new AuthoredMotionSampler(data.clip);
  const pose = sampler.createPose();
  const engine = new AuthoredAvatarEngine(canvas, {
    preset: data.preset,
    size: 320,
    poseOverrides: true,
    assetLoader: async (preset, detail) => {
      if (preset !== data.preset || detail !== 'high')
        throw Error('Review fixture requires its captured preset/detail');
      const asset = await loadAuthoredAsset(preset, detail);
      asset.material = structuredClone(data.material);
      for (const part of asset.parts)
        part.fields = asset.material.parts.find((p) => p.id === part.id)!.fields;
      return asset;
    },
  });
  return {
    engine,
    seek(seconds: number) {
      sampler.sample(Math.max(0, Math.min(data.clip.duration, seconds)), pose);
      engine.setPose(0, pose);
    },
  };
}
