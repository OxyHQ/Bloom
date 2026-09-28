import { Button } from '../button/Button.web';
import React from 'react';

import { ComposerPillBase } from './ComposerPillBase';
import { ComposerPopover } from './ComposerPopover.web';
import { ComposerPopoverContext, ComposerButtonContext } from './context';
import type { ComposerPillProps } from './types';

/**
 * `ComposerPill` — WEB: its menus open in `floating/FloatingPanel`.
 * The implementation is `ComposerPillBase`; this file only binds the panel.
 */
export function ComposerPill(props: ComposerPillProps) {
  return (
    <ComposerButtonContext.Provider value={Button}>
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerPillBase {...props} />
    </ComposerPopoverContext.Provider>
    </ComposerButtonContext.Provider>
  );
}
ComposerPill.displayName = 'ComposerPill';
