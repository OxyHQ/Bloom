import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectItemText } from '../select';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { AgentCreatorBase } from './AgentCreatorBase';
import { AgentCreatorContext } from './context';
import type { AgentCreatorProps } from './types';
const bindings = { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectItemText, Popover, PopoverTrigger, PopoverContent };
export function AgentCreator(props: AgentCreatorProps) {
  return <AgentCreatorContext.Provider value={bindings}><AgentCreatorBase {...props} /></AgentCreatorContext.Provider>;
}
