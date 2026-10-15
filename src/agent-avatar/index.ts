export { AgentAvatar } from './AgentAvatar';
export { AgentAvatarProvider } from './AgentAvatarProvider';
export { BLOOM_CHARACTER_RUNTIME_URL } from './context';
export type { AgentAvatarProps, AgentAvatarProviderProps } from './types';

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
