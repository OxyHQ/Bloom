import { memo } from 'react';
import { type AvatarCharacter, resolveAvatarCharacter } from '../agent-avatar/character';
import { CHARACTER_COLORS } from '../agent-avatar/character-colors';
import { VectorStaticPortrait } from '../agent-avatar/VectorStaticPortrait';
import { useStaticPortraits } from '../agent-avatar/use-static-portraits';

/** Body contours are static: browsing shapes never downloads animation clips (`use-static-portraits`). */
export const ShapeSilhouette = memo(function ShapeSilhouette({
  character,
}: {
  character: AvatarCharacter;
}) {
  const portraits = useStaticPortraits();
  const resolved = resolveAvatarCharacter(character);
  const bodyColor =
    'bodyColor' in resolved.paint
      ? resolved.paint.bodyColor
      : CHARACTER_COLORS[resolved.paint.color];
  return (
    <VectorStaticPortrait
      frame={portraits?.vectorShapePortraits[resolved.shape]}
      size={56}
      bodyColor={bodyColor}
    />
  );
});
