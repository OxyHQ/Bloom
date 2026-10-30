/**
 * The NATIVE anchored panel, shown in a platform popup (`BloomProvider
 * platform={…}` with `popup-surface`, e.g. an OxyOS compositor popup that may
 * extend beyond the window). The native families choose it instead of
 * `dialog/SheetShell` only when the adapter reports that capability; without
 * one they keep the sheet.
 *
 * The panel is the web `FloatingPanel`'s menu chrome — the menu palette, the
 * 16px radius, a hairline border and the 266px floor — drawn with inline
 * styles. Placement is the platform's: Bloom passes its `side` / `align` /
 * offsets and the platform keeps the panel on screen.
 */
import type React from 'react';
import type { ComponentRef, ComponentType, RefObject } from 'react';
import { StyleSheet, type View, type StyleProp, type ViewStyle } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import type { PopupDismissReason, PopupSurfaceProps } from '../platform-surface/types';
import { DEFAULT_ALIGN_OFFSET, DEFAULT_SIDE_OFFSET, MENU_WIDTH } from './constants';
import { useMenuPalette } from './menu-palette';
import type { FloatingPositionProps } from './types';
import { useMenuDensity } from './use-menu-density';
import { usePopupNavigation } from './popup-navigation';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';

/** `rounded-radius-16`, the web menu panel's corner. */
const PANEL_RADIUS = 16;

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
  minWidth = MENU_WIDTH,
  maxWidth,
  maxHeight,
  className,
  style,
  testID,
  children,
}: PopupPanelProps) {
  const palette = useMenuPalette();
  const density = useMenuDensity();
  // The platform's keys move an active row among the panel's rows (`popup-navigation`).
  const navigation = usePopupNavigation(onClose);
  // Screen-reader focus moves into the menu when it opens, as into a sheet (`SheetShell`); the
  // panel is mounted only while open. The trigger takes it back on close
  // (`TriggerSlot`'s `useRestoreAccessibilityFocus`).
  const panelRef = useAccessibilityFocus<ComponentRef<typeof View>>(true);
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
      <StyledView
        ref={panelRef}
        className={className}
        style={[
          styles.panel,
          {
            minWidth,
            maxWidth,
            maxHeight,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            padding: density.panelPadding,
            gap: density.gap,
          },
          style,
        ]}
      >
        {navigation.provider(children)}
      </StyledView>
    </PopupSurface>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: PANEL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
