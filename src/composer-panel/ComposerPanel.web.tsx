import { Button } from '../button/Button.web';
import React from 'react';

import { ComposerPanelBase } from './ComposerPanelBase';
import { ComposerPopover } from './ComposerPopover.web';
import * as Dropdown from '../dropdown-menu/index.web';
import { ComposerDropdownContext, ComposerPopoverContext, ComposerButtonContext } from './context';
import type { ComposerPanelProps } from './types';

/**
 * `ComposerPanel` — WEB: its menus open in `floating/FloatingPanel`.
 * The implementation is `ComposerPanelBase`; this file only binds the panel.
 */
export function ComposerPanel(props: ComposerPanelProps) {
  return (
    <ComposerButtonContext.Provider value={Button}>
      <ComposerPopoverContext.Provider value={ComposerPopover}>
        <ComposerDropdownContext.Provider value={Dropdown}>
          <ComposerPanelBase {...props} />
        </ComposerDropdownContext.Provider>
      </ComposerPopoverContext.Provider>
    </ComposerButtonContext.Provider>
  );
}
ComposerPanel.displayName = 'ComposerPanel';
