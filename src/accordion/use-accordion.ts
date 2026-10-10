import { useCallback, useContext, useId, useMemo } from 'react';
import { useCollapsibleMotion } from '../collapsible/use-collapsible-motion';
import { AccordionContext } from './context';
import type { AccordionProps } from './types';

export function useAccordionState({ value, onValueChange, type = 'single', transition = 'spring' }: AccordionProps) {
  const expandedValues = useMemo(() => new Set(value == null ? [] : Array.isArray(value) ? value : [value]), [value]);
  const toggle = useCallback((item: string) => {
    if (type === 'single') onValueChange(expandedValues.has(item) ? undefined : item);
    else {
      const next = new Set(expandedValues);
      if (next.has(item)) next.delete(item); else next.add(item);
      onValueChange([...next]);
    }
  }, [expandedValues, onValueChange, type]);
  return useMemo(() => ({ expandedValues, toggle, type, transition }), [expandedValues, toggle, type, transition]);
}

export function useAccordionItem(value: string, disabled: boolean) {
  const { expandedValues } = useContext(AccordionContext);
  const id = useId();
  const isExpanded = expandedValues.has(value);
  return useMemo(() => ({ value, disabled, isExpanded, triggerId: `${id}-trigger`, contentId: `${id}-content` }), [value, disabled, isExpanded, id]);
}

/** Preserve accordion's spring defaults while sharing reveal cancellation. */
export function useAccordionMotion(expanded: boolean, kind: 'trigger' | 'content', useNativeDriver: boolean) {
  const { transition } = useContext(AccordionContext);
  return useCollapsibleMotion(expanded, transition, kind, useNativeDriver).progress;
}
