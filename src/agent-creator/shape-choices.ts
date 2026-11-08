import type { AvatarShapeId } from '../agent-avatar/catalog-ids';
import { CHARACTER_SHAPES } from '../agent-avatar/character-shapes';

/** Editor equivalences only. Saved character IDs and authored templates remain unchanged. */
export const EDITOR_SHAPE_ALIASES = {
  todd: 'rounded_head_two_ears',
  circle: 'bot_blob',
  heart: 'bot_heart',
  capsule: 'bot_tablet',
  squircle: 'bot_square',
  petal: 'bot_teardrop',
} as const satisfies Partial<Record<AvatarShapeId, AvatarShapeId>>;

export function editorShapeId(shape: AvatarShapeId): AvatarShapeId {
  return EDITOR_SHAPE_ALIASES[shape as keyof typeof EDITOR_SHAPE_ALIASES] ?? shape;
}

/** One choice per visually distinct silhouette, shared by every editor selector. */
export const EDITOR_SHAPE_CHOICES = CHARACTER_SHAPES.filter(([id]) => editorShapeId(id) === id);
