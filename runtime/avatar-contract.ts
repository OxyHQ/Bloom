import type { AgentAvatarProps } from '../src/agent-avatar/types';
import type { CharacterCapabilities } from '../src/agent-avatar/context';

export type EditorRenderProps = Pick<
  AgentAvatarProps,
  | 'config'
  | 'paused'
  | 'portrait'
  | 'workingKey'
  | 'workingCycles'
  | 'interactive'
  | 'reactionKey'
  | 'entranceKey'
> & { reduced: boolean; legacy?: unknown; previewPart?: 'eyes' };

export type EditorRecipe = {
  preset: string;
  color?: string;
  capabilities: CharacterCapabilities;
};
