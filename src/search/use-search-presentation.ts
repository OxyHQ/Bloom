import { motionDurationMs } from '../motion/spec';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { SearchPresentationContext, SEARCH_EXPAND } from './context';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { useContext, useEffect, useRef, useState, type RefObject, type ComponentRef } from 'react';
import type { LayoutChangeEvent, TextInput } from 'react-native';
import type { Button } from '../button';
import { useContainerWidth } from '../hooks/use-container-width';
import { useControllableState } from '../hooks/use-controllable-state';
import type { SearchProps } from './types';

interface SearchPresentationState {
  expanded: boolean;
  collapsible: boolean;
  onLayout: ((event: LayoutChangeEvent) => void) | undefined;
  trigger: RefObject<ComponentRef<typeof Button> | null>;
  show: () => void;
  close: () => void;
  focus: () => void;
  blur: () => void;
}

/** One opening/focus lifecycle for toolbar, sidebar and standalone searches. */
export function useSearchPresentation(
  props: Pick<
    SearchProps,
    | 'presentation'
    | 'expandedMinWidth'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'value'
    | 'tokens'
    | 'clearOnClose'
    | 'onClearText'
  >,
  input: React.RefObject<ComponentRef<typeof TextInput> | null>,
): SearchPresentationState {
  const { presentation = 'field', expandedMinWidth = 240 } = props;
  const host = useContext(SearchPresentationContext);
  const onActiveChange = host?.onActiveChange;
  const compactHost = host?.compact;
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useControllableState({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const [dismissed, setDismissed] = useState(false);
  const [focused, setFocused] = useState(false);
  const { width, onLayout } = useContainerWidth();
  const roomy =
    presentation === 'auto' && !host?.compact && width !== null && width >= expandedMinWidth;
  const hasQuery = !!props.value || !!props.tokens?.length;
  const expanded =
    presentation === 'field' ||
    roomy ||
    open ||
    (presentation === 'auto' && (focused || (hasQuery && !dismissed)));
  useIsomorphicLayoutEffect(() => {
    if (!onActiveChange) return;
    if (!compactHost || expanded || reducedMotion) {
      onActiveChange(Boolean(compactHost && expanded));
      return;
    }
    // Keep the allocated row while the capsule closes; releasing it sooner
    // changes 100% to the collapsed width in one layout pass and skips the exit.
    const exit = setTimeout(() => onActiveChange(false), motionDurationMs(SEARCH_EXPAND));
    return () => clearTimeout(exit);
  }, [onActiveChange, compactHost, expanded, reducedMotion]);
  useEffect(() => () => onActiveChange?.(false), [onActiveChange]);
  const trigger = useRef<ComponentRef<typeof Button>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const latest = useRef({ ...props, setOpen, roomy });
  latest.current = { ...props, setOpen, roomy };
  const cancelBlur = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  // Controlled opening also transfers focus. Resizing into a full field never steals it.
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => input.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, input]);
  const close = () => {
    cancelBlur();
    if (props.clearOnClose) props.onClearText?.();
    setDismissed(true);
    setFocused(false);
    setOpen(false);
    input.current?.blur();
    cancelBlur();
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      trigger.current?.focus?.();
    });
  };
  return {
    expanded,
    collapsible: presentation !== 'field' && !roomy,
    onLayout: presentation === 'auto' ? onLayout : undefined,
    trigger,
    show: () => {
      setDismissed(false);
      setOpen(true);
    },
    close,
    focus: () => {
      cancelBlur();
      setDismissed(false);
      setFocused(true);
    },
    blur: () => {
      cancelBlur();
      if (presentation === 'field') return;
      timer.current = setTimeout(() => {
        timer.current = null;
        setFocused(false);
        const current = latest.current;
        if (!current.value && !current.tokens?.length) current.setOpen(false);
      }, 150);
    },
  };
}
