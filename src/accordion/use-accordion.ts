import { useCallback, useContext, useLayoutEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { animation } from '../styles/tokens';
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

/** One motion policy for both forks, including a live OS preference change. */
export function useAccordionMotion(expanded: boolean, kind: 'trigger' | 'content', useNativeDriver: boolean) {
  const { transition } = useContext(AccordionContext);
  const reduced = usePrefersReducedMotion();
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const duration = transition === 'spring' ? undefined : transition.duration;
  const [x1, y1, x2, y2] = transition === 'spring' || !transition.easing ? [.25, .1, .25, 1] : transition.easing;
  const easing = useMemo(() => Easing.bezier(x1, y1, x2, y2), [x1, y1, x2, y2]);
  useLayoutEffect(() => {
    progress.stopAnimation();
    const toValue = expanded ? 1 : 0;
    if (reduced || duration === 0) { progress.setValue(toValue); return; }
    const motion = duration === undefined
      ? Animated.spring(progress, { toValue, useNativeDriver, ...animation.spring[kind === 'trigger' ? 'snappy' : 'gentle'] })
      : Animated.timing(progress, { toValue, useNativeDriver, duration: Math.max(0, duration), easing });
    motion.start();
    return () => motion.stop();
  }, [expanded, progress, reduced, duration, easing, kind, useNativeDriver]);
  return progress;
}
