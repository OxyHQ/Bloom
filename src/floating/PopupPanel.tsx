/**
 * The NATIVE anchored panel, shown in a platform popup (`BloomProvider
 * platform={…}` with `popup-surface`, e.g. an OxyOS compositor popup that may
 * extend beyond the window). The native families choose it instead of
 * `dialog/SheetShell` only when the adapter reports that capability; without
 * one they keep the sheet.
 *
 * The panel is the web `FloatingPanel`'s menu chrome, part for part: the menu
 * palette's surface painted as Bloom's surface MATERIAL (`SurfacePaint`, whose
 * native paint is the web material's body with its edge light as inset light),
 * a 1px border the material covers (transparent, as the web's is under the
 * material), `shadow-dropdown`, the 16px corner, the density's padding and row
 * gap, and the 266px floor. Before, it was an opaque fill inside a grey
 * hairline the web never draws. Placement is the platform's: Bloom passes its
 * `side` / `align` / offsets and the platform keeps the panel on screen.
 */
import type React from 'react';
import { createContext, useContext, useState } from 'react';
import type { ComponentRef, ComponentType, RefObject } from 'react';
import { StyleSheet, type View, type StyleProp, type ViewStyle } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { PopupDismissReason, PopupSurfaceProps } from '../platform-surface/types';
import { DEFAULT_ALIGN_OFFSET, DEFAULT_SIDE_OFFSET, MENU_WIDTH } from './constants';
import { useMenuPalette } from './menu-palette';
import type { FloatingPositionProps } from './types';
import { useMenuDensity } from './use-menu-density';
import { type PopupNavigation, usePopupNavigation } from './popup-navigation';
import type { MenuFocusIntent } from './menu-keyboard';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';

/** `rounded-radius-16`, the web menu panel's corner (`SURFACE_SHAPES.menu`). */
const PANEL_RADIUS = 16;

/** `border`, the web menu panel's edge: one layout pixel, as on the web at every scale. */
export const POPUP_PANEL_BORDER = 1;

/**
 * The platform's popup component around a popup panel's rows, for a submenu that flies out
 * beside its row in a popup of its own (`menu-sub-inline.tsx`). Null outside a popup panel.
 */
const PopupSurfaceContext = createContext<ComponentType<PopupSurfaceProps> | null>(null);

export function usePanelPopupSurface(): ComponentType<PopupSurfaceProps> | null {
  return useContext(PopupSurfaceContext);
}

/**
 * A menu panel's chrome and its rows, shared by a menu's panel and its flyouts' panels so the
 * two cannot drift.
 */
export function PopupPanelChrome({
  minWidth = MENU_WIDTH,
  maxWidth,
  maxHeight,
  className,
  style,
  panelRef,
  children,
}: {
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  panelRef?: React.Ref<ComponentRef<typeof View>>;
  children?: React.ReactNode;
}) {
  const palette = useMenuPalette();
  const density = useMenuDensity();
  return (
    <StyledView
      ref={panelRef}
      className={className}
      style={[
        styles.panel,
        {
          minWidth,
          maxWidth,
          maxHeight,
          boxShadow: palette.shadow,
          padding: density.panelPadding,
        },
        style,
      ]}
    >
      <SurfacePaint
        fill={palette.surface}
        radius={PANEL_RADIUS}
        outset={POPUP_PANEL_BORDER}
        floating
      />
      {/* The rows' box, which clips what reaches past it as the web panel's scroller does: a
          separator's negative margin ends at the rows' edges, under their highlight's, as it
          is drawn on the web, not at the panel's. */}
      <StyledView style={[styles.rows, { gap: density.gap }]}>{children}</StyledView>
    </StyledView>
  );
}

export interface PopupPanelProps extends FloatingPositionProps {
  /** The adapter's popup component (`usePopupSurface()`). */
  PopupSurface: ComponentType<PopupSurfaceProps>;
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  /** A point in the anchor to open at (a context menu's press), instead of its frame. */
  point?: PopupSurfaceProps['point'];
  role: PopupSurfaceProps['role'];
  label?: string;
  onDismiss: (reason: PopupDismissReason) => void;
  /** Escape or Tab from the keyboard: the owner closes the popup. */
  onClose: () => void;
  /** Where an open from the keyboard lands: its first or last enabled row active. */
  focusIntent?: MenuFocusIntent;
  /** Given the panel's keyboard navigation (a menu bar asks it which arrows it takes). */
  navigationRef?: React.MutableRefObject<PopupNavigation | null>;
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export function PopupPanel({
  PopupSurface,
  anchorRef,
  point,
  side = 'bottom',
  align = 'start',
  sideOffset = DEFAULT_SIDE_OFFSET,
  alignOffset = DEFAULT_ALIGN_OFFSET,
  role,
  label,
  onDismiss,
  onClose,
  focusIntent,
  navigationRef,
  minWidth,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
  children,
}: PopupPanelProps) {
  // Opened from the keys on a row: that row takes the screen reader's focus (`MenuRowShell`), not
  // the panel. Read before the navigation takes the intent.
  const [openedOnRow] = useState(
    () => focusIntent?.edge.current === 'first' || focusIntent?.edge.current === 'last',
  );
  // The platform's keys move an active row among the panel's rows (`popup-navigation`).
  const navigation = usePopupNavigation(onClose, focusIntent);
  if (navigationRef) navigationRef.current = navigation;
  // Screen-reader focus moves into the menu when it opens, as into a sheet (`SheetShell`); the
  // panel is mounted only while open. The trigger takes it back on close
  // (`TriggerSlot`'s `useRestoreAccessibilityFocus`).
  const panelRef = useAccessibilityFocus<ComponentRef<typeof View>>(!openedOnRow);
  return (
    <PopupSurface
      anchorRef={anchorRef}
      point={point}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      role={role}
      label={label}
      onDismiss={onDismiss}
      onKey={navigation.onKey}
      testID={testID}
    >
      {/* The popup surface carries the content's role and label; labelling the panel too
          would announce the menu's name twice. */}
      <PopupPanelChrome
        panelRef={panelRef}
        minWidth={minWidth}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        className={className}
        style={style}
      >
        <PopupSurfaceContext.Provider value={PopupSurface}>
          {navigation.provider(children)}
        </PopupSurfaceContext.Provider>
      </PopupPanelChrome>
    </PopupSurface>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: PANEL_RADIUS,
    borderWidth: POPUP_PANEL_BORDER,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  rows: { overflow: 'hidden', flexShrink: 1, minHeight: 0 },
});
