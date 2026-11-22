import {
  type AgentCreatorAgent,
  AgentCreatorField as BloomAgentCreatorField,
  type AgentCreatorProps,
  AgentCreatorSection as BloomAgentCreatorSection,
  AgentCreator as BloomAgentCreator,
} from '@oxy.so/bloom/agent-creator';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The agent editor: its character, details and the host's own sections. */
export type AgentCreatorKind = 'agentCreator' | 'agentCreatorField' | 'agentCreatorSection';

type Slots = 'children' | 'sections';
/**
 * Bloom `AgentCreator`'s data and handlers (its words, voices, preferences);
 * its own rows (`children`, under its details) and `sections` (below them)
 * are language children.
 */
export type AgentCreatorOptions = Omit<
  AgentCreatorProps,
  'agent' | 'onChange' | 'className' | 'style' | Slots
> & { readonly [K in Slots]?: Child };

/** Bloom `AgentCreator`. */
export type AgentCreatorView = ViewModifiers<AgentCreatorView>;
/** Bloom `AgentCreatorField`: a name at the start and its control beside it. */
export interface AgentCreatorFieldView extends ViewModifiers<AgentCreatorFieldView> {
  /** A taller row whose label sits at the top, for a multi-line control. */
  multiline(value?: boolean): AgentCreatorFieldView;
  /** The hairline above the row: on by default; `.divider(false)` for a card's first row. */
  divider(value?: boolean): AgentCreatorFieldView;
}
/** Bloom `AgentCreatorSection`: a titled card of the host's own rows. */
export type AgentCreatorSectionView = ViewModifiers<AgentCreatorSectionView>;

/** Bloom `AgentCreator`, editing the agent its binding holds. */
export function AgentCreator(
  agent: Binding<AgentCreatorAgent>,
  options: AgentCreatorOptions = {},
): AgentCreatorView {
  return new Node('agentCreator', { binding: agent, options }, []);
}
/** Bloom `AgentCreatorField` named `label`, its control `content`. */
export function AgentCreatorField(label: string, content: Child): AgentCreatorFieldView {
  return new Node('agentCreatorField', { label }, [content]);
}
/** Bloom `AgentCreatorSection` titled `title`, its rows `content` (a list keyed by `.id()`). */
export function AgentCreatorSection(title: string, content: Child): AgentCreatorSectionView {
  return new Node('agentCreatorSection', { title }, [content]);
}

export const AGENT_CREATORS: Record<AgentCreatorKind, ControlRenderer> = {
  agentCreator: product(BloomAgentCreator, {
    binding: ['agent', 'onChange'],
    slots: ['children', 'sections'],
  }),
  agentCreatorField: product(BloomAgentCreatorField, {
    own: (d) => ({ multiline: d.own('multiline')?.value, divider: d.own('divider')?.value }),
  }),
  agentCreatorSection: product(BloomAgentCreatorSection),
};
