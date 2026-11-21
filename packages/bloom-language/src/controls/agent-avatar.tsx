import {
  AgentAvatar as BloomAgentAvatar,
  type AgentAvatarProps as BloomAgentAvatarProps,
  type AvatarCharacter,
} from '@oxy.so/bloom/agent-avatar';

import { Node, type ViewModifiers } from '../node';
import { type AgentMood, type AvatarSizeToken, resolveAvatarSize } from '../tokens';
import type { ControlRenderer } from './draw';

/** Agent avatars: the vector character an agent is drawn as. */
export type AgentAvatarKind = 'agentAvatar';

/**
 * What an agent avatar is told besides its look, as Bloom's `AgentAvatar` takes
 * it: a change of a key plays its motion (a reaction, the return to idle, an
 * entrance, a working loop), and the renderer reports its first picture.
 */
export type AgentAvatarOptions = Pick<
  BloomAgentAvatarProps,
  | 'locale'
  | 'catalog'
  | 'reactionKey'
  | 'idleKey'
  | 'entranceKey'
  | 'workingKey'
  | 'workingCycles'
  | 'onReady'
  | 'onLoadingChange'
>;

export interface AgentAvatarNodeProps {
  readonly character: AvatarCharacter;
  readonly options: AgentAvatarOptions;
}

/** Bloom `AgentAvatar`: the character drawn by Bloom's renderer on every platform. */
export interface AgentAvatarView extends ViewModifiers<AgentAvatarView> {
  /** Its edge: an avatar rung or an app token; Bloom's 64 when none. */
  size(value: AvatarSizeToken): AgentAvatarView;
  /** `neutral` (default) or `sad`: a head shake, then a dejected idle until it changes. */
  mood(value: AgentMood): AgentAvatarView;
  /** Holds the settled pose. */
  paused(value: boolean): AgentAvatarView;
  /** Answers the pointer and touches (its gaze follows them). */
  interactive(value?: boolean): AgentAvatarView;
  /** A cached still instead of a live renderer: for a picker's thumbnails. */
  portrait(value?: boolean): AgentAvatarView;
}

/**
 * Bloom `AgentAvatar`: `character` is what it is (`{ preset: 'blue_beret' }` is
 * a complete one). `.label()` names it.
 */
export function AgentAvatar(
  character: AvatarCharacter,
  options: AgentAvatarOptions = {},
): AgentAvatarView {
  return new Node('agentAvatar', { character, options } satisfies AgentAvatarNodeProps, []);
}

export const AGENT_AVATARS: Record<AgentAvatarKind, ControlRenderer> = {
  agentAvatar: (d) => {
    const { character, options } = d.node.props as AgentAvatarNodeProps;
    const size = d.own('size')?.value as AvatarSizeToken | undefined;
    return d.pressAround((props) =>
      d.component(BloomAgentAvatar, {
        ...props,
        ...options,
        character,
        size: size === undefined ? undefined : resolveAvatarSize(size),
        mood: d.own('mood')?.value,
        paused: d.own('paused')?.value,
        interactive: d.own('interactive')?.value,
        portrait: d.own('portrait')?.value,
      }),
    );
  },
};
