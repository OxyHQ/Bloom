import { memo, useContext } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { ProceduralAvatar } from './ProceduralAvatar';
import { CharacterRuntimeContext } from './context';
import { legacyRecipeUnsupported } from './legacy-recipe';
import type { AgentAvatarProps } from './types';

/** Both catalogs use the recovered engine when their recipe is supported. */
export const AgentAvatar = memo(function AgentAvatar(props: AgentAvatarProps) {
  const { runtimeUrl } = useContext(CharacterRuntimeContext);
  const beta =
    props.config.character && props.config.character.preset !== 'bloom';
  const legacy = runtimeUrl && !legacyRecipeUnsupported(props.config);
  return beta || legacy ? (
    <CharacterAvatar key={beta ? 'character' : 'legacy'} {...props} />
  ) : (
    <ProceduralAvatar {...props} />
  );
});
