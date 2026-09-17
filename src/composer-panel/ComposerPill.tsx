import React from 'react';

import { ComposerPillBase } from './ComposerPillBase';
import { ComposerPopover } from './ComposerPopover';
import { ComposerPopoverContext } from './context';
import type { ComposerPillProps } from './types';

/**
 * `ComposerPill` — NATIVE: its menus open in the family's anchored `Modal` panel.
 * The implementation is `ComposerPillBase`; this file only binds the panel.
 */
export function ComposerPill(props: ComposerPillProps) {
  return (
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerPillBase {...props} />
    </ComposerPopoverContext.Provider>
  );
}
ComposerPill.displayName = 'ComposerPill';
