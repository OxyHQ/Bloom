import React, {
  cloneElement,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Text } from '../typography';
import type { DialogControlProps } from '../dialog/types';
import { OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { Z_INDEX } from '../styles/z-index';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { resolveDropdownPlacement } from '../overlay/dropdown-placement';
import { bloomShadowStyle } from '../design-tokens/shadows';
import {
  MenuContext,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from './context';
import type {
  MenuContextType,
  MenuGroupProps,
  MenuItemIconProps,
  MenuItemProps,
  MenuItemTextProps,
  MenuTriggerProps,
} from './types';

const VIEWPORT_GUTTER = 8;
const MENU_OFFSET = 6;

export type MenuControlProps = {
  id: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export function useMenuControl(): MenuControlProps {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  return useMemo(
    () => ({
      id,
      isOpen,
      open() {
        setIsOpen(true);
      },
      close() {
        setIsOpen(false);
      },
    }),
    [id, isOpen],
  );
}

/**
 * Adapter that wraps MenuControlProps to satisfy the DialogControlProps
 * interface required by MenuContextType. This avoids using type suppressions
 * by providing a real ref object.
 */
function useMenuControlAsDialogControl(
  menuControl: MenuControlProps,
): DialogControlProps {
  const ref = useRef<{ open: () => void; close: (cb?: () => void) => void } | null>(null);

  return useMemo<DialogControlProps>(() => {
    const dialogControl: DialogControlProps = {
      id: menuControl.id,
      ref,
      open() {
        menuControl.open();
      },
      close(cb?: () => void) {
        menuControl.close();
        if (typeof cb === 'function') {
          cb();
        }
      },
    };
    return dialogControl;
  }, [menuControl]);
}

export function Menu({
  children,
  control,
}: React.PropsWithChildren<{
  control?: MenuControlProps;
}>) {
  const defaultControl = useMenuControl();
  const activeControl = control ?? defaultControl;
  const dialogControl = useMenuControlAsDialogControl(activeControl);
  const rootRef = useRef<View>(null);
  const triggerRef = useRef<unknown>(null);
  const dropdownRef = useRef<unknown>(null);

  const context = useMemo<MenuContextType>(
    () => ({
      control: dialogControl,
      isOpen: activeControl.isOpen,
      triggerRef,
      dropdownRef,
    }),
    [activeControl.isOpen, dialogControl],
  );

  useEffect(() => {
    if (!activeControl.isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const rootNode = rootRef.current as unknown as HTMLElement | null;
      const dropdownNode = dropdownRef.current as HTMLElement | null;
      const eventTarget = event.target as Node;
      if (rootNode?.contains(eventTarget) || dropdownNode?.contains(eventTarget)) {
        return;
      }
      activeControl.close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        activeControl.close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeControl]);

  return (
    <MenuContext.Provider value={context}>
      <View
        ref={rootRef}
        style={[styles.root, activeControl.isOpen && styles.openRoot]}
      >
        {children}
      </View>
    </MenuContext.Provider>
  );
}

export function MenuTrigger({
  children,
  label,
  role = 'button',
  hint,
}: MenuTriggerProps) {
  const { control, triggerRef } = useMenuContext();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  return children({
    control,
    state: {
      hovered,
      focused,
      pressed: false,
    },
    props: {
      ref: triggerRef,
      onPress: () => control.open(),
      onFocus,
      onBlur,
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  });
}

export function MenuContent({
  children,
  style,
}: React.PropsWithChildren<{
  showCancel?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const theme = useTheme();
  const context = useMenuContext();
  const [position, setPosition] = useState<ViewStyle | null>(null);
  // The mounted dropdown node, as STATE rather than a bare ref: positioning has
  // to measure it, and `Portal` renders null on its first pass (it resolves its
  // host in its own layout effect), so the node lands one render after
  // `isOpen` flips. An effect keyed only on `isOpen` would measure nothing.
  const [dropdownNode, setDropdownNode] = useState<HTMLElement | null>(null);

  const attachDropdown = useCallback(
    (node: View | null) => {
      // The shared ref stays in sync — `Menu`'s outside-pointerdown check reads it.
      if (context.dropdownRef) {
        context.dropdownRef.current = node;
      }
      setDropdownNode(node as unknown as HTMLElement | null);
    },
    [context.dropdownRef],
  );

  useLayoutEffect(() => {
    if (!context.isOpen || typeof window === 'undefined') {
      return;
    }

    const triggerNode = context.triggerRef?.current as HTMLElement | null;
    if (!triggerNode?.getBoundingClientRect || !dropdownNode) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerNode.getBoundingClientRect();
      // Measured BEFORE `minWidth` is applied, so the final surface can only be
      // wider than this — and a wider surface wraps less, so the measured height
      // is an upper bound. Erring that way flips early in a tie, never late.
      const surface = dropdownNode.getBoundingClientRect();
      const width = Math.max(surface.width, rect.width);

      setPosition({
        position: WEB_POSITION_FIXED,
        ...resolveDropdownPlacement({
          anchor: rect,
          size: { width, height: surface.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          offset: MENU_OFFSET,
          gutter: VIEWPORT_GUTTER,
          align: 'end',
          side: 'bottom',
        }),
        right: undefined,
        bottom: undefined,
        minWidth: width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [context.isOpen, context.triggerRef, dropdownNode]);

  if (!context.isOpen) {
    return null;
  }

  return (
    <Portal>
      {/* `OverlayRoot` takes this menu's place in the open-order overlay stack.
          The dropdown used to carry a fixed `zIndex` on the `dropdown` rung
          (41), below the `overlay` rung a Dialog sits on (50/60) — so a menu
          opened from inside a dialog rendered behind that dialog, whichever
          opened last. It is `box-none`, so the area around the dropdown stays
          click-through and the existing outside-press dismissal still sees the
          press. */}
      <OverlayRoot>
        <View
          ref={attachDropdown}
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.isDark
                ? theme.colors.backgroundSecondary
                : theme.colors.background,
              borderColor: theme.colors.borderLight,
              ...bloomShadowStyle('m'),
            },
            style,
            styles.portaledDropdown,
            position,
          ]}
        >
          {children}
        </View>
      </OverlayRoot>
    </Portal>
  );
}

export function MenuItem({ children, label, onPress, style, ...rest }: MenuItemProps) {
  const theme = useTheme();
  const { control } = useMenuContext();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const handlePress = useCallback(
    (e: import('react-native').GestureResponderEvent) => {
      onPress(e);
      if (!e.defaultPrevented) {
        control.close();
      }
    },
    [control, onPress],
  );

  const isDisabled = Boolean(rest.disabled);
  const isHighlighted = (hovered || focused) && !isDisabled;

  const itemContextValue = useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter: onHoverIn,
        onMouseLeave: onHoverOut,
      } as Record<string, () => void>)}
      style={[
        styles.webItem,
        isHighlighted && {
          backgroundColor: theme.isDark
            ? theme.colors.contrast50
            : theme.colors.backgroundSecondary,
        },
        style,
      ]}
    >
      <ItemContext.Provider value={itemContextValue}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  );
}

export function MenuItemText({ children, style }: MenuItemTextProps) {
  const theme = useTheme();
  const { disabled } = useMenuItemContext();

  return (
    <Text
      style={[
        styles.webItemText,
        { color: disabled ? theme.colors.textTertiary : theme.colors.text },
        ...(style ? [style] : []),
      ]}
    >
      {children}
    </Text>
  );
}

export function MenuItemIcon({ icon: Comp, position = 'left', fill }: MenuItemIconProps) {
  const theme = useTheme();
  const { disabled } = useMenuItemContext();

  return (
    <View
      style={[
        position === 'left' && styles.iconLeft,
        position === 'right' && styles.iconRight,
      ]}
    >
      <Comp
        size="md"
        fill={
          fill
            ? fill({ disabled })
            : disabled
              ? theme.colors.textTertiary
              : theme.colors.textSecondary
        }
      />
    </View>
  );
}

export function MenuGroup({ children }: MenuGroupProps) {
  return <>{children}</>;
}

export function MenuDivider() {
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

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  openRoot: {
    // The INLINE trigger wrapper, still in the app's own document flow — this
    // only lifts it over adjacent in-flow content while the menu is open. The
    // portaled dropdown's depth is the overlay stack's business, not this.
    zIndex: Z_INDEX.dropdown,
  },
  dropdown: {
    // Fixed from the outset, not only once positioned: the `Portal` root is a
    // block container, so a static child would stretch to the full viewport
    // width and the pre-position measurement would under-read the height (less
    // wrapping at a width the surface never actually has). A fixed box
    // shrink-wraps to the same width it ends up with.
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
    // Overlay elevation applied at the usage site via `bloomShadowStyle('m')`.
    minWidth: 180,
  },
  portaledDropdown: {
    pointerEvents: 'auto',
  },
  webItem: {
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
  webItemText: {
    flex: 1,
    fontWeight: '600',
  },
  iconLeft: {
    marginLeft: -2,
  },
  iconRight: {
    marginRight: -2,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

export { useMenuContext };
