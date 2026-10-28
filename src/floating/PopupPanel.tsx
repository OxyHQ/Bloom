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

/** `rounded-radius-16`, the web menu panel's corner. */
const PANEL_RADIUS = 16;

export interface PopupPanelProps extends FloatingPositionProps {
  /** The adapter's popup component (`usePopupSurface()`). */
  PopupSurface: ComponentType<PopupSurfaceProps>;
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  role: PopupSurfaceProps['role'];
  label?: string;
  onDismiss: (reason: PopupDismissReason) => void;
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
  side = 'bottom',
  align = 'start',
  sideOffset = DEFAULT_SIDE_OFFSET,
  alignOffset = DEFAULT_ALIGN_OFFSET,
  role,
  label,
  onDismiss,
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
  return (
    <PopupSurface
      anchorRef={anchorRef}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      role={role}
      label={label}
      onDismiss={onDismiss}
      testID={testID}
    >
      <StyledView
        accessibilityLabel={label}
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
        {children}
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
