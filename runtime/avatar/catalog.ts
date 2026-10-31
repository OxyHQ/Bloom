import * as THREE from 'three';
import { decodeIndexBuffer } from './index-buffer';

export const AVATAR_PRESETS = [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];
export type DrawFields = Record<string, number[]>;
type RenderState = {
  transparent?: boolean;
  depthWrite?: boolean;
  depthTest?: boolean;
  doubleSided?: boolean;
  renderOrder?: number;
  furRenderOrder?: number;
};
export type MaterialRecord = {
  preset: AvatarPreset;
  frame: DrawFields;
  parts: ({
    id: number;
    materialKind: number;
    fields: DrawFields;
    label: string;
    attachment: string;
    fur: boolean;
    universal?: boolean;
  } & RenderState)[];
  copy: { args: number[] };
  crop: number[];
};
type Range = { byteOffset: number; byteLength: number; count: number };
export type GeometryRecord = {
  buffer: { byteLength: number; sha256: string };
  parts: {
    id: number;
    vertices: Range & { attributes: Record<string, { components: number; byteOffset: number }> };
    indices: (Range & { componentType: string })[];
    fur: Range | null;
  }[];
};
export type AuthoredPart = RenderState & {
  geometry: THREE.InstancedBufferGeometry;
  id: number;
  kind: number;
  fur: boolean;
  fields: DrawFields;
  label: string;
  attachment: string;
  universal?: boolean;
  activity?: 'computer';
  colorRole?: 'body';
};
export type AuthoredAsset = {
  preset: AvatarPreset;
  material: MaterialRecord;
  parts: AuthoredPart[];
};
const urls = import.meta.glob(
  './assets/{blue_beret,alfred,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones}/{geometry,geometry-low,computer-geometry,material,computer-material,reference}.{json,bin,png}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
) as Record<string, string>;
export function assetUrl(preset: AvatarPreset, name: string) {
  const url = urls[`./assets/${preset}/${name}`];
  if (!url) throw Error(`Missing avatar asset: ${preset}/${name}`);
  return url;
}
export async function fetchResource(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Avatar resource failed (${response.status}): ${url}`);
  return response;
}
export async function loadAuthoredAsset(
  preset: AvatarPreset,
  detail: 'low' | 'high' = 'high',
  activities = false,
): Promise<AuthoredAsset> {
  const base = await loadAssetFiles(preset, detail);
  if (activities) {
    const baseIds = new Set(base.material.parts.map((part) => part.id));
    const computer = await loadAssetFiles(preset, 'computer', baseIds);
    for (const part of base.parts) {
      const description = computer.material.parts.find((p) => p.id === part.id)!;
      part.renderOrder = part.fur ? description.furRenderOrder : description.renderOrder;
    }
    base.parts.push(...computer.parts);
    base.material.parts.push(...computer.material.parts.filter((part) => !baseIds.has(part.id)));
  }
  return base;
}
async function loadAssetFiles(
  preset: AvatarPreset,
  detail: 'low' | 'high' | 'computer',
  excludeIds?: ReadonlySet<number>,
): Promise<AuthoredAsset> {
  const geometryName = detail === 'low' ? 'geometry-low' : 'geometry';
  const prefix = detail === 'computer' ? 'computer-' : '';
  const [manifest, material, binary] = await Promise.all([
    fetchResource(assetUrl(preset, `${prefix}${geometryName}.json`)).then((r) =>
      r.json(),
    ) as Promise<GeometryRecord>,
    fetchResource(assetUrl(preset, `${prefix}material.json`)).then((r) =>
      r.json(),
    ) as Promise<MaterialRecord>,
    fetchResource(assetUrl(preset, `${prefix}${geometryName}.bin`)).then((r) => r.arrayBuffer()),
  ]);
  return decodeAuthoredAsset(preset, manifest, material, binary, detail === 'computer', excludeIds);
}
/** Decode the renderer's semantic asset format; no native assembly parser. */
export function decodeAuthoredAsset(
  preset: AvatarPreset,
  manifest: GeometryRecord,
  material: MaterialRecord,
  binary: ArrayBuffer,
  activity = false,
  excludeIds?: ReadonlySet<number>,
): AuthoredAsset {
  if (
    manifest.buffer.byteLength !== binary.byteLength ||
    material.parts.length !== manifest.parts.length
  )
    throw Error(`Inconsistent avatar resources: ${preset}`);
  const parts: AuthoredPart[] = [];
  for (const record of manifest.parts) {
    if (excludeIds?.has(record.id)) continue;
    const description = material.parts[record.id]!;
    const geometry = new THREE.InstancedBufferGeometry();
    const interleaved = new THREE.InterleavedBuffer(
      new Float32Array(binary, record.vertices.byteOffset, record.vertices.byteLength / 4),
      24,
    );
    const names: Record<string, string> = {
      positionDelta0: 'delta0',
      normalTarget0: 'normal0',
      positionDelta1: 'delta1',
      normalTarget1: 'normal1',
    };
    for (const [name, attr] of Object.entries(record.vertices.attributes))
      geometry.setAttribute(
        names[name] ?? name,
        new THREE.InterleavedBufferAttribute(interleaved, attr.components, attr.byteOffset / 4),
      );
    const joints = new THREE.Uint16BufferAttribute(new Uint16Array(record.vertices.count * 4), 4);
    joints.gpuType = THREE.IntType;
    geometry.setAttribute('skinJoints', joints);
    geometry.setAttribute(
      'skinWeights',
      new THREE.Float32BufferAttribute(new Float32Array(record.vertices.count * 4), 4),
    );
    geometry.setIndex(new THREE.BufferAttribute(decodeIndexBuffer(binary, record.indices), 1));
    parts.push({
      geometry,
      id: record.id,
      kind: description.materialKind,
      fur: false,
      fields: description.fields,
      label: description.label,
      attachment: description.attachment,
      universal: description.universal,
      activity: activity ? 'computer' : undefined,
      // The native Computer hand material is identified by its semantic tag.
      // Eyes, clothing, panels and content keep their own authored pigments.
      colorRole:
        record.id === 0 ||
        description.attachment === 'three_lobe' ||
        (activity && description.fields.referencePose?.[3] === -40)
          ? 'body'
          : undefined,
      transparent: description.transparent,
      depthWrite: description.depthWrite,
      depthTest: description.depthTest,
      doubleSided: description.doubleSided,
      renderOrder: description.renderOrder,
    });
  }
  // The live renderer uses solid surfaces. Strand records remain in authored
  // source archives for historical inspection, but never allocate CPU/GPU ribbons.
  return { preset, material, parts };
}
