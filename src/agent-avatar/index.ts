export { AgentAvatar } from './AgentAvatar';
export { AgentAvatarProvider } from './AgentAvatarProvider';
export { BLOOM_CHARACTER_RUNTIME_URL } from './context';
export { useAvatarRendererCapabilities } from './use-avatar-renderer-capabilities';
export type { AgentAvatarMood, AgentAvatarProps, AgentAvatarProviderProps } from './types';

// One model: a character. `resolveAvatarCharacter` fills it in, `parseAvatarCharacter`
// checks saved JSON, `characterFromLegacy` migrates an avatar saved before 10.
export {
  avatarBodyHex,
  avatarCharacterOf,
  parseAvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from './character';
export type { AvatarCharacter, ResolvedAvatarCharacter } from './character';
export { characterFromLegacy } from './legacy-character';
export {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYEWEAR,
  AVATAR_PRESETS,
  AVATAR_SHAPES,
} from './catalog-ids';
export type {
  AvatarAccessoryId,
  AvatarColorId,
  AvatarEyesId,
  AvatarEyewearId,
  AvatarPresetId,
  AvatarShapeId,
} from './catalog-ids';
export { isSvgEyes, isSvgShape, SVG_EYES, SVG_SHAPES } from './svg-catalog';
export type { SvgAvatarEyesId, SvgAvatarShapeId } from './svg-catalog';

// Which vector assets an app ships: `createVectorAssetLoader` plus the per-asset modules
// under `@oxy.so/bloom/agent-avatar/catalog/*` (docs/agent-avatar.mdx).
export { createVectorAssetLoader } from './vector-loader';
export type { VectorAssetImport, VectorAssetLoader, VectorAssetSources } from './vector-loader';
