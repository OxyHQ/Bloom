import {
  AgentProfile as BloomAgentProfile,
  type AgentProfileProps,
  AgentReplyIdentity as BloomAgentReplyIdentity,
  type AgentReplyIdentityProps,
} from '@oxy.so/bloom/agent-reply';
import type { AvatarCharacter } from '@oxy.so/bloom/agent-avatar';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** An agent's reply: who answered, and the agents in the conversation. */
export type AgentReplyKind = 'agentProfile' | 'agentReplyIdentity';

/** Bloom `AgentProfile`'s visible label, its menu's state and its avatar's flight. */
export type AgentProfileOptions = Pick<
  AgentProfileProps,
  'label' | 'expanded' | 'avatarRef' | 'avatarHidden'
>;
/**
 * Bloom `AgentReplyIdentity`'s state (`thinking`, `workingKey`) and avatar
 * flight; `reasoning` (what the row folds open on while it thinks) is a
 * language child.
 */
export type AgentReplyIdentityOptions = Pick<
  AgentReplyIdentityProps,
  'thinking' | 'workingKey' | 'avatarHidden' | 'avatarRef'
> & { readonly reasoning?: Child };

/** Bloom `AgentProfile`: the conversation's agents; `.onPress()` opens their menu, `.label()` names it. */
export type AgentProfileView = ViewModifiers<AgentProfileView>;
/** Bloom `AgentReplyIdentity`: `.onPress()` opens the agent, `.label()` names that press. */
export type AgentReplyIdentityView = ViewModifiers<AgentReplyIdentityView>;

/** Bloom `AgentProfile` of `agents`. */
export function AgentProfile(
  agents: AgentProfileProps['agents'],
  options: AgentProfileOptions = {},
): AgentProfileView {
  return new Node('agentProfile', { agents, options }, []);
}
/** Bloom `AgentReplyIdentity` of the agent named `name`, drawn as `character`. */
export function AgentReplyIdentity(
  character: AvatarCharacter,
  name: string,
  options: AgentReplyIdentityOptions = {},
): AgentReplyIdentityView {
  return new Node('agentReplyIdentity', { character, name, options }, []);
}

export const AGENT_REPLIES: Record<AgentReplyKind, ControlRenderer> = {
  agentProfile: product(BloomAgentProfile, { press: true }),
  agentReplyIdentity: (d) => {
    const { character, name, options } = d.node.props as {
      character: AvatarCharacter;
      name: string;
      options: AgentReplyIdentityOptions;
    };
    const { onPress } = d.props() as { onPress?: () => void };
    const { reasoning, ...rest } = options;
    return d.component(BloomAgentReplyIdentity, {
      ...rest,
      key: d.key,
      character,
      name,
      reasoning: reasoning === undefined ? undefined : d.render(reasoning),
      onPress,
      pressLabel: d.label,
    });
  },
};
