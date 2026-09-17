import React from 'react';

import { ComposerStatusBarBase } from './ComposerStatusBarBase';
import { ComposerPopover } from './ComposerPopover';
import { ComposerPopoverContext } from './context';
import type { ComposerStatusBarProps } from './types';

/**
 * `ComposerStatusBar` — NATIVE: its menus open in the family's anchored `Modal` panel.
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
