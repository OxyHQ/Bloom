import React from 'react';

import { ComposerPillBase } from './ComposerPillBase';
import { ComposerPopover } from './ComposerPopover.web';
import { ComposerPopoverContext } from './context';
import type { ComposerPillProps } from './types';

/**
 * `ComposerPill` — WEB: its menus open in `floating/FloatingPanel`.
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
