import React from 'react';

import { ComposerPillBase } from './ComposerPillBase';
import { ComposerPopover } from './ComposerPopover';
import * as Dropdown from '../dropdown-menu/index';
import { ComposerDropdownContext, ComposerPopoverContext } from './context';
import type { ComposerPillProps } from './types';

/**
 * `ComposerPill` — NATIVE: its menus open in the family's anchored `Modal` panel.
 * The implementation is `ComposerPillBase`; this file only binds the panel.
 */
export function ComposerPill(props: ComposerPillProps) {
  return (
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerDropdownContext.Provider value={Dropdown}>
        <ComposerPillBase {...props} />
      </ComposerDropdownContext.Provider>
    </ComposerPopoverContext.Provider>
  );
}
ComposerPill.displayName = 'ComposerPill';
