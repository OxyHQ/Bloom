import { Button } from '../button/Button.web';
import React from 'react';

import { ComposerStatusBarBase } from './ComposerStatusBarBase';
import { ComposerPopover } from './ComposerPopover.web';
import { ComposerPopoverContext, ComposerButtonContext } from './context';
import type { ComposerStatusBarProps } from './types';

/**
 * `ComposerStatusBar` — WEB: its menus open in `floating/FloatingPanel`.
 * The implementation is `ComposerStatusBarBase`; this file only binds the panel.
 */
export function ComposerStatusBar(props: ComposerStatusBarProps) {
  return (
    <ComposerButtonContext.Provider value={Button}>
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerStatusBarBase {...props} />
    </ComposerPopoverContext.Provider>
    </ComposerButtonContext.Provider>
  );
}
ComposerStatusBar.displayName = 'ComposerStatusBar';
