import { createContext, useContext } from 'react';
import type * as SelectParts from '../select/Select';
import type * as PopoverParts from '../popover/Popover';
export type AgentCreatorBindings = Pick<typeof SelectParts, 'Select' | 'SelectTrigger' | 'SelectValue' | 'SelectContent' | 'SelectItem' | 'SelectItemText'> & Pick<typeof PopoverParts, 'Popover' | 'PopoverTrigger' | 'PopoverContent'>;
export const AgentCreatorContext = createContext<AgentCreatorBindings | null>(null);
export function useAgentCreatorBindings() {
  const value = useContext(AgentCreatorContext);
  if (!value) throw new Error('AgentCreator requires its platform bindings');
  return value;
}
