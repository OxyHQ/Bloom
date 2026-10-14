import { memo, useMemo } from 'react';
import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import { type AvatarCharacter, updateAvatarCharacter } from '../agent-avatar/character';

/** Body-only view of a shape in the current paint. Never alter the saved face or accessories. */
export const ShapeSilhouette = memo(function ShapeSilhouette({
  character,
}: {
  character: AvatarCharacter;
}) {
  const body = useMemo(
    () => updateAvatarCharacter(character, { eyes: 'none', eyewear: 'none', accessory: 'none' }),
    [character],
  );
  return <AgentAvatar character={body} size={56} portrait paused interactive={false} />;
});
