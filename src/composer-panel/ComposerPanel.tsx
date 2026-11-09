import React from 'react';

import { ComposerPanelBase } from './ComposerPanelBase';
import { ComposerPopover } from './ComposerPopover';
import * as Dropdown from '../dropdown-menu/index';
import { ComposerDropdownContext, ComposerPopoverContext } from './context';
import type { ComposerPanelProps } from './types';

/**
 * `ComposerPanel` — NATIVE: its menus open in anchored `Modal` panels.
 * The implementation is `ComposerPanelBase`; this file only binds the panel.
 */
export function ComposerPanel(props: ComposerPanelProps) {
  return (
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ComposerDropdownContext.Provider value={Dropdown}>
        <ComposerPanelBase {...props} />
      </ComposerDropdownContext.Provider>
    </ComposerPopoverContext.Provider>
  );
}
ComposerPanel.displayName = 'ComposerPanel';
