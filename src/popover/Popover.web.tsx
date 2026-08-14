import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Backdrop, OverlayRoot } from '../overlay';
import { resolveDropdownPlacement } from '../overlay/dropdown-placement';
import { Portal } from '../portal/index.web';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { PopoverContext, usePopoverContext } from './context';
import type {
  PopoverContentProps,
  PopoverControlProps,
  PopoverPlacement,
  PopoverProps,
  PopoverTriggerProps,
} from './types';

/**
 * Web self-contained control. Unlike native (which proxies a `BottomSheet`
 * via `useDialogControl`), the web popover owns its own open state and
 * exposes a `DialogControlProps`-shaped handle for API parity.
 */
export function usePopoverControl(): PopoverControlProps {
  const id = useId();
  const [, setIsOpen] = useState(false);
  const ref = useRef<{ open: () => void; close: (cb?: () => void) => void }>({
    open: () => {},
    close: () => {},
  });

  return useMemo<PopoverControlProps>(
    () => ({
      id,
      ref,
      open: () => setIsOpen(true),
      close: (cb) => {
        setIsOpen(false);
        cb?.();
      },
    }),
    [id],
  );
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Popover({ children, control }: PopoverProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View | null>(null);
  const refHandle = useRef<{ open: () => void; close: (cb?: () => void) => void }>({
    open: () => {},
    close: () => {},
  });

  const activeControl = useMemo<PopoverControlProps>(
    () =>
      control ?? {
        id,
        ref: refHandle,
        open: () => setIsOpen(true),
        close: (cb) => {
          setIsOpen(false);
          cb?.();
        },
      },
    [control, id],
  );

  // When an external control is provided, mirror its open/close into local
  // state so Content renders. The external control still drives `open/close`.
  const wrappedControl = useMemo<PopoverControlProps>(
    () => ({
      ...activeControl,
      open: () => {
        setIsOpen(true);
        activeControl.open();
      },
      close: (cb) => {
        setIsOpen(false);
        activeControl.close(cb);
      },
    }),
    [activeControl],
  );

  const context = useMemo(
    () => ({ control: wrappedControl, isOpen, triggerRef }),
    [wrappedControl, isOpen],
  );

  return (
    <PopoverContext.Provider value={context}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, label }: PopoverTriggerProps) {
  const { control, triggerRef, isOpen } = usePopoverContext();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const rendered = children({
    control,
    state: { hovered, focused, pressed: false },
    props: {
      onPress: () => control.open(),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      accessibilityLabel: label,
      accessibilityRole: 'button',
      'aria-expanded': isOpen,
      'aria-haspopup': 'dialog',
    },
  });

  return (
    <View
      ref={triggerRef}
      collapsable={false}
      style={styles.triggerWrap}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as Record<string, () => void>)}>
      {rendered}
    </View>
  );
}

/** Minimum distance kept from every viewport edge. */
const VIEWPORT_GUTTER = 8;

/**
 * Split a `PopoverPlacement` into the two axes `resolveDropdownPlacement`
 * takes. A bare `'bottom'`/`'top'` centres on the trigger, which is why the
 * shared resolver grew `align: 'center'`.
 */
function axesFor(placement: PopoverPlacement): {
  side: 'bottom' | 'top';
  align: 'start' | 'end' | 'center';
} {
  return {
    side: placement.startsWith('top') ? 'top' : 'bottom',
    align: placement.endsWith('end')
      ? 'end'
      : placement.endsWith('start')
        ? 'start'
        : 'center',
  };
}

export function PopoverContent({
  children,
  label = 'Popover',
  placement = 'bottom-start',
  offset = 6,
  minWidth,
  maxWidth = 360,
  dismissible = true,
  style,
  testID,
}: PopoverContentProps) {
  const theme = useTheme();
  const { control, isOpen, triggerRef } = usePopoverContext();
  const [rect, setRect] = useState<Rect | null>(null);
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null);
  const panelRef = useRef<View | null>(null);

  const measure = useCallback(() => {
    const node = triggerRef.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      setRect({ x, y, width, height });
    });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setRect(null);
      setPanelSize(null);
      return;
    }
    measure();
  }, [isOpen, measure]);

  // Reposition on scroll / resize while open.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const onChange = () => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [isOpen, measure]);

  // Escape to dismiss.
  useEffect(() => {
    if (!isOpen || !dismissible || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        control.close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, dismissible, control]);

  if (!isOpen || !rect) return null;

  const resolvedMinWidth = minWidth ?? rect.width;
  const position =
    panelSize && typeof window !== 'undefined'
      ? resolveDropdownPlacement({
          anchor: {
            top: rect.y,
            bottom: rect.y + rect.height,
            left: rect.x,
            right: rect.x + rect.width,
          },
          size: panelSize,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          offset,
          gutter: VIEWPORT_GUTTER,
          ...axesFor(placement),
        })
      : { left: rect.x, top: rect.y + rect.height + offset };

  return (
    <Portal>
      {/* `OverlayRoot` takes this surface's place in the open-order overlay
          stack, so it paints above anything opened before it (see
          `src/overlay/stack.ts`). It is `box-none`, so the area outside the
          panel stays click-through and the backdrop below still takes its own
          presses. */}
      <OverlayRoot>
        {dismissible ? (
          <Backdrop
            style={styles.backdrop}
            onPress={() => control.close()}
            accessibilityLabel="Dismiss popover"
          />
        ) : null}
        <View
          ref={panelRef}
          accessibilityRole="none"
          aria-label={label}
          testID={testID}
          onLayout={(e) =>
            setPanelSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
          style={[
            styles.panel,
            {
              left: position.left,
              top: position.top,
              minWidth: resolvedMinWidth,
              maxWidth,
              backgroundColor: theme.isDark
                ? theme.colors.backgroundSecondary
                : theme.colors.background,
              borderColor: theme.colors.borderLight,
              // Design-system overlay elevation (`shadow-m`) as a `boxShadow` —
              // RN-Web deprecated the `shadow*` style props.
              ...bloomShadowStyle('m'),
              // Hide until measured to avoid a one-frame jump.
              opacity: panelSize ? 1 : 0,
            },
            style,
          ]}>
          {children}
        </View>
      </OverlayRoot>
    </Portal>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    alignSelf: 'flex-start',
  },
  backdrop: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'auto',
  },
  panel: {
    position: WEB_POSITION_FIXED,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    // Elevation applied at the usage site via `bloomShadowStyle('m')` (boxShadow).
    pointerEvents: 'auto',
  },
});

export { usePopoverContext };
