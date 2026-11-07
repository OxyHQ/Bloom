import { memo } from 'react';
import { type AvatarCharacter, resolveAvatarCharacter } from '../agent-avatar/character';
import { CHARACTER_COLORS } from '../agent-avatar/character-colors';
import { VectorStaticPortrait } from '../agent-avatar/VectorStaticPortrait';
import { vectorShapePortraits } from '../agent-avatar/vector-static';

/** Body contours are static: browsing shapes never downloads animation clips. */
export const ShapeSilhouette = memo(function ShapeSilhouette({
  character,
}: {
  character: AvatarCharacter;
}) {
  const resolved = resolveAvatarCharacter(character);
  const bodyColor =
    'bodyColor' in resolved.paint
      ? resolved.paint.bodyColor
      : CHARACTER_COLORS[resolved.paint.color];
  return (
    <VectorStaticPortrait
      frame={vectorShapePortraits[resolved.shape]!}
      size={56}
      bodyColor={bodyColor}
    />
  );
});
