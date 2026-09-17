import React from 'react';

import { ComposerStatusBarBase } from './ComposerStatusBarBase';
import { ComposerPopover } from './ComposerPopover.web';
import { ComposerPopoverContext } from './context';
import type { ComposerStatusBarProps } from './types';

/**
 * `ComposerStatusBar` — WEB: its menus open in `floating/FloatingPanel`.
 * The implementation is `ComposerStatusBarBase`; this file only binds the panel.
 */
export function ComposerStatusBar(props: ComposerStatusBarProps) {
  return (
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerStatusBarBase {...props} />
    </ComposerPopoverContext.Provider>
  );
}
ComposerStatusBar.displayName = 'ComposerStatusBar';
