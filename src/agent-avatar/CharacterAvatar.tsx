import { VectorCharacterAvatar } from './VectorCharacterAvatar';
import { VectorCharacterPortrait } from './VectorCharacterPortrait';
import type { AgentAvatarProps } from './types';

/** Every saved character uses local SVG geometry on both platforms. */
export function CharacterAvatar(props: AgentAvatarProps & { previewPart?: 'eyes' }) {
  return props.portrait && !props.previewPart ? (
    <VectorCharacterPortrait {...props} />
  ) : (
    <VectorCharacterAvatar {...props} />
  );
}
