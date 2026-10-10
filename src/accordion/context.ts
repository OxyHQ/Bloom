import { createContext } from 'react';
import type { AccordionTransition, AccordionType } from './types';

export interface AccordionContextValue {
  expandedValues: Set<string>;
  toggle: (value: string) => void;
  type: AccordionType;
  transition: AccordionTransition;
}
export const AccordionContext = createContext<AccordionContextValue>({
  expandedValues: new Set(),
  toggle: () => {},
  type: 'single',
  transition: 'spring',
});
export const AccordionItemContext = createContext({
  value: '',
  isExpanded: false,
  disabled: false,
  triggerId: '',
  contentId: '',
});
