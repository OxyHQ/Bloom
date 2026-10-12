import { memo } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import type { AgentAvatarProps } from './types';

/** Every recipe uses the same character renderer on web and native. */
export const AgentAvatar = memo(function AgentAvatar(props: AgentAvatarProps) {
  return <CharacterAvatar {...props} />;
});
