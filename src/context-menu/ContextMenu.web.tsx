/**
 * ContextMenu — Web implementation
 *
 * Opens a positioned dropdown menu on right-click (contextmenu event).
 * Uses Bloom's Portal for rendering the menu above other content.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { useInteractionState } from '../hooks/use-interaction-state';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import {
  resolveDropdownPlacement,
  type DropdownPlacement,
} from '../overlay/dropdown-placement';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { ItemCtx, useItemContext } from './context';
import type {
  ContextMenuContextValue,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemIconProps,
  ContextMenuItemProps,
  ContextMenuItemTextProps,
  ContextMenuTriggerProps,
  ItemContextValue,
} from './types';

const VIEWPORT_GUTTER = 8;

// ---------------------------------------------------------------------------
// Web-specific context (extends base with position)
// ---------------------------------------------------------------------------

type Position = { x: number; y: number };

type WebContextMenuContextValue = ContextMenuContextValue & {
  position: Position | null;
};

const WebContextMenuContext = createContext<WebContextMenuContextValue | null>(null);
WebContextMenuContext.displayName = 'WebContextMenuContext';

function useWebContextMenuContext(): WebContextMenuContextValue {
  const ctx = useContext(WebContextMenuContext);
  if (!ctx) {
    throw new Error(
      'ContextMenu components must be used within a <ContextMenu>',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// ContextMenu (Root)
// ---------------------------------------------------------------------------

export function ContextMenu({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const isOpen = position !== null;

  const ctx = useMemo<WebContextMenuContextValue>(
    () => ({
      isOpen,
      position,
      open: () => {
        /* open is handled by the ContextMenuTrigger's contextmenu event */
      },
      close: () => setPosition(null),
    }),
    [isOpen, position],
  );

  /**
   * We store the setPosition in a ref so the ContextMenuTrigger can call it
   * without needing a stable identity on `open`.
   */
  return (
    <WebContextMenuContext.Provider value={ctx}>
      <SetPositionContext.Provider value={setPosition}>
        {children}
      </SetPositionContext.Provider>
    </WebContextMenuContext.Provider>
  );
}

const SetPositionContext = createContext<
  React.Dispatch<React.SetStateAction<Position | null>>
>(() => {});
SetPositionContext.displayName = 'ContextMenuSetPositionContext';

// ---------------------------------------------------------------------------
// ContextMenuTrigger
// ---------------------------------------------------------------------------

export function ContextMenuTrigger({ children, label, hint, style }: ContextMenuTriggerProps) {
  const ctx = useWebContextMenuContext();
  const setPosition = useContext(SetPositionContext);
  const triggerRef = useRef<View>(null);

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
    },
    [setPosition],
  );

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    // On web, View refs resolve to DOM elements
    const element = node as unknown as HTMLElement;
    element.addEventListener('contextmenu', handleContextMenu);
    return () => {
      element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu]);

  return (
    <View ref={triggerRef} style={style}>
      {children({
        isOpen: ctx.isOpen,
        state: {
          hovered: false,
          focused: false,
          pressed: false,
        },
        props: {
          onPress: null,
          onLongPress: null,
          onFocus: null,
          onBlur: null,
          accessibilityLabel: label,
          accessibilityHint: hint ?? 'Right-click to open context menu',
        },
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuContent
// ---------------------------------------------------------------------------

export function ContextMenuContent({ children, style }: ContextMenuContentProps) {
  const ctx = useWebContextMenuContext();
  const theme = useTheme();
  const { isOpen, close, position } = ctx;
  // The mounted menu node, as STATE rather than a bare ref: placement has to
  // measure it, and `Portal` renders null on its first pass (it resolves its
  // host in its own layout effect), so the node lands one render after the
  // menu opens. An effect keyed only on `position` would measure nothing.
  const [menuNode, setMenuNode] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<DropdownPlacement | null>(null);

  const attachMenu = useCallback((node: View | null) => {
    setMenuNode(node as unknown as HTMLElement | null);
  }, []);

  // The right-click point is a zero-area anchor, so the surface sits below-right
  // of the cursor when it fits, flips above when it doesn't, and clamps into the
  // viewport when neither fits. Without this a menu opened near an edge hung off
  // the fold with its rows unreachable.
  useLayoutEffect(() => {
    if (!position || !menuNode || typeof window === 'undefined') {
      setPlacement(null);
      return;
    }
    const surface = menuNode.getBoundingClientRect();
    setPlacement(
      resolveDropdownPlacement({
        anchor: { top: position.y, bottom: position.y, left: position.x, right: position.x },
        size: { width: surface.width, height: surface.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        offset: 0,
        gutter: VIEWPORT_GUTTER,
        align: 'start',
        side: 'bottom',
      }),
    );
  }, [position, menuNode]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen || !position) return null;

  return (
    <Portal>
      {/* `OverlayRoot` takes this surface's place in the open-order overlay
          stack, so it paints above anything opened before it (see
          `src/overlay/stack.ts`). It is `box-none`, so the area outside the
          panel stays click-through and the backdrop below still takes its own
          presses. */}
      <OverlayRoot>
        <Backdrop
          style={styles.backdrop}
          onPress={close}
          accessibilityLabel="Close context menu"
        />
        <View
          ref={attachMenu}
          style={[
            styles.dropdown,
            {
              // The raw click point is the pre-measurement anchor; the layout
              // effect above replaces it before the browser paints.
              top: placement?.top ?? position.y,
              left: placement?.left ?? position.x,
              backgroundColor: theme.isDark
                ? theme.colors.backgroundSecondary
                : theme.colors.background,
              borderColor: theme.colors.borderLight,
              ...bloomShadowStyle('m'),
            },
            style,
          ]}
        >
          {children}
        </View>
      </OverlayRoot>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItem
// ---------------------------------------------------------------------------

export function ContextMenuItem({
  children,
  label,
  onPress,
  disabled = false,
  style,
}: ContextMenuItemProps) {
  const theme = useTheme();
  const { close } = useWebContextMenuContext();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isHighlighted = (hovered || focused) && !disabled;

  const handlePress = useCallback(() => {
    onPress();
    close();
  }, [onPress, close]);

  const itemCtx = useMemo<ItemContextValue>(
    () => ({ disabled }),
    [disabled],
  );

  return (
    <Pressable
      accessibilityHint=""
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.item,
        isHighlighted && {
          backgroundColor: theme.isDark
            ? theme.colors.contrast50
            : theme.colors.backgroundSecondary,
        },
        style,
      ]}
    >
      <ItemCtx.Provider value={itemCtx}>{children}</ItemCtx.Provider>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItemText
// ---------------------------------------------------------------------------

export function ContextMenuItemText({ children, style }: ContextMenuItemTextProps) {
  const theme = useTheme();
  const { disabled } = useItemContext();

  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={[
        styles.itemText,
        { color: disabled ? theme.colors.textTertiary : theme.colors.text },
        ...(style ? [style] : []),
      ]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItemIcon
// ---------------------------------------------------------------------------

export function ContextMenuItemIcon({ icon: Comp }: ContextMenuItemIconProps) {
  const theme = useTheme();
  const { disabled } = useItemContext();

  return (
    <Comp
      size="md"
      fill={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
    />
  );
}

// ---------------------------------------------------------------------------
// ContextMenuGroup
// ---------------------------------------------------------------------------

export function ContextMenuGroup({ children }: ContextMenuGroupProps) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// ContextMenuDivider
// ---------------------------------------------------------------------------

export function ContextMenuDivider() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  dropdown: {
    position: WEB_POSITION_FIXED,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
    // Overlay elevation applied at the usage site via `bloomShadowStyle('m')`.
    minWidth: 180,
    maxWidth: 280,
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 10,
    // Matches the native sheet row (`index.tsx`). Bloom's web build is what
    // renders on touch tablets, where this dropdown — not the sheet — is the
    // menu, so the row carries the same 44dp target on both platforms.
    minHeight: 44,
  },
  itemText: {
    flex: 1,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
