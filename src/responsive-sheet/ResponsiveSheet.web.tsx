import React from 'react';

import { Dialog } from '../dialog/index.web';
import {
  BREAKPOINT_LG,
  BREAKPOINT_MD,
  BREAKPOINT_SM,
  BREAKPOINT_XL,
  DIALOG_SHEET_BACKDROP_TESTID,
  type ResponsiveDialogPlacement,
} from '../dialog/placement';
import type { ResponsiveSheetProps } from './types';

/**
 * @deprecated Use `<Dialog placement={{ base: 'bottom', md: 'left' }}>` instead.
 *
 * Web fork of the deprecated `ResponsiveSheet` wrapper. Identical delegation to
 * the default fork, but imports the web `Dialog` explicitly so non-Metro web
 * bundlers never follow the native (reanimated) `Dialog` sibling.
 */
export function ResponsiveSheet({
  open,
  onClose,
  side = 'left',
  breakpoint = BREAKPOINT_MD,
  width,
  maxHeightRatio,
  inset,
  showHandle,
  dismissOnBackdrop,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label,
  children,
}: ResponsiveSheetProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement={placementForSide(side, breakpoint)}
      width={width}
      maxHeightRatio={maxHeightRatio}
      inset={inset}
      showHandle={showHandle}
      dismissOnBackdrop={dismissOnBackdrop}
      panelStyle={panelStyle}
      panelClassName={panelClassName}
      containerStyle={containerStyle}
      containerClassName={containerClassName}
      label={label}
    >
      {children}
    </Dialog>
  );
}

function placementForSide(
  side: 'left' | 'right',
  breakpoint: number,
): ResponsiveDialogPlacement {
  if (breakpoint <= BREAKPOINT_SM) return { base: 'bottom', sm: side };
  if (breakpoint <= BREAKPOINT_MD) return { base: 'bottom', md: side };
  if (breakpoint <= BREAKPOINT_LG) return { base: 'bottom', lg: side };
  if (breakpoint <= BREAKPOINT_XL) return { base: 'bottom', xl: side };
  return { base: 'bottom', xl: side };
}

/**
 * @deprecated Stable testID for the dimmed backdrop dismiss button — now
 * provided by the underlying `<Dialog>`'s side/bottom backdrop.
 */
export const RESPONSIVE_SHEET_BACKDROP_TESTID = DIALOG_SHEET_BACKDROP_TESTID;

export default ResponsiveSheet;
