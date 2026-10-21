import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { useWindowDimensions, type View } from 'react-native';
import { FloatingPanel } from '../floating/FloatingPanel';
import { hostElement } from '../floating/menu-keyboard';
import { sameAnchor } from '../floating/use-anchor-rect';
import { useFrameThrottle } from '../floating/use-frame-throttle';
import type { FloatingAnchor } from '../floating/types';
import type { SuggestionPanelProps } from './suggestion-panel-types';

/** A typing-owned list uses the same placement/material/scroll owner as menus. */
export function SuggestionPanel({
  anchor,
  open,
  onOpenChange,
  listboxId,
  label,
  busy,
  maxHeight,
  style,
  testID,
  scrollRef,
  children,
}: SuggestionPanelProps) {
  const viewport = useWindowDimensions();
  const [rect, setRect] = useState<FloatingAnchor | null>(null);
  const panel = useRef<ComponentRef<typeof View> | null>(null);
  const latest = useRef({ anchor, onOpenChange });
  latest.current = { anchor, onOpenChange };
  const measure = useCallback(() => {
    const next = latest.current.anchor.getRect();
    setRect((previous) => (sameAnchor(previous, next) ? previous : next));
  }, []);
  const [schedule, cancel] = useFrameThrottle(measure);
  // Re-read after typing/selection updates as well as ancestor scrolling.
  useLayoutEffect(() => {
    if (open) measure();
  }, [open, anchor, children, measure]);
  useEffect(() => {
    if (!open) return;
    const focus = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        hostElement(panel.current)?.contains(target) ||
        hostElement(latest.current.anchor.contextRef.current)?.contains(target)
      )
        return;
      latest.current.onOpenChange?.(false);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('selectionchange', schedule);
    document.addEventListener('focusin', focus);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    const context = hostElement(anchor.contextRef.current);
    if (context) observer?.observe(context);
    return () => {
      cancel();
      observer?.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('selectionchange', schedule);
      document.removeEventListener('focusin', focus);
    };
  }, [open, anchor.contextRef, schedule, cancel]);
  const dismiss = useCallback(() => latest.current.onOpenChange?.(false), []);
  return (
    <FloatingPanel
      open={open}
      anchor={rect}
      contextRef={anchor.contextRef}
      onDismiss={dismiss}
      modal={false}
      role="listbox"
      surface="menu"
      nativeID={listboxId}
      label={label}
      busy={busy}
      align="start"
      side="bottom"
      sideOffset={4}
      maxHeight={maxHeight}
      style={[{ width: Math.min(300, Math.max(0, viewport.width - 16)) }, style]}
      testID={testID}
      scrollRef={scrollRef}
      panelRef={(node) => {
        panel.current = node;
      }}
      onMouseDown={(event) => {
        if (event.button === 0) event.preventDefault();
      }}
    >
      {children}
    </FloatingPanel>
  );
}
