import { memo, useMemo } from 'react';
import { materializeCharacter } from '../agent-avatar/character-shapes';
import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import type { AvatarConfig } from '../agent-avatar/model';

/** Body-only view of a shape in the current paint. Never alter the saved face or accessories. */
export const ShapeSilhouette = memo(function ShapeSilhouette({ config }: { config: AvatarConfig }) {
  const body = useMemo<AvatarConfig>(
    () => ({
      ...config,
      face: false,
      character: {
        ...materializeCharacter(config),
        selections: {
          ...materializeCharacter(config).selections,
          eyes: 'none',
          eyewear: 'none',
          accessory: 'none',
        },
      },
    }),
    [config],
  );
  return <AgentAvatar config={body} size={56} portrait paused interactive={false} />;
});
