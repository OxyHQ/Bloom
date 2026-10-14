import type { ResolvedAvatarCharacter } from '../src/agent-avatar/character';
import type { CharacterCapabilities } from '../src/agent-avatar/context';
import type { AgentAvatarProps } from '../src/agent-avatar/types';

/** What the renderer is handed: the character, resolved, and how to play it. */
export type EditorRenderProps = Pick<
  AgentAvatarProps,
  | 'paused'
  | 'portrait'
  | 'workingKey'
  | 'workingCycles'
  | 'interactive'
  | 'reactionKey'
  | 'entranceKey'
> & { character: ResolvedAvatarCharacter; reduced: boolean; previewPart?: 'eyes' };

export type EditorRecipe = {
  preset: string;
  color?: string;
  capabilities: CharacterCapabilities;
};
