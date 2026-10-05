import { createContext, useContext } from 'react';
import { useMessages } from '../locale/messages';
import type * as PopoverParts from '../popover/Popover';
import type * as SelectParts from '../select';
import { AGENT_CREATOR_MESSAGES, type AgentCreatorMessages } from './messages';

export type AgentCreatorBindings = Pick<
  typeof SelectParts,
  | 'Select'
  | 'SelectTrigger'
  | 'SelectValue'
  | 'SelectIcon'
  | 'SelectContent'
  | 'SelectItem'
  | 'SelectItemText'
> &
  Pick<typeof PopoverParts, 'Popover' | 'PopoverTrigger' | 'PopoverContent'>;
export const AgentCreatorContext = createContext<AgentCreatorBindings | null>(
  null,
);
export const AgentCreatorCopyContext = createContext<{
  locale?: string;
  labels?: Partial<AgentCreatorMessages>;
} | null>(null);
export function useAgentCreatorBindings() {
  const value = useContext(AgentCreatorContext);
  if (!value) throw new Error('AgentCreator requires its platform bindings');
  return value;
}
export function useAgentCreatorMessages(overrides?: {
  locale?: string;
  labels?: Partial<AgentCreatorMessages>;
}) {
  const inherited = useContext(AgentCreatorCopyContext);
  const configured = overrides ?? inherited;
  const { messages } = useMessages(AGENT_CREATOR_MESSAGES, configured?.locale);
  return { ...messages, ...configured?.labels };
}
