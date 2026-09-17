import React from 'react';

import { ComposerPopover } from './ComposerPopover';
import { ComposerPopoverContext } from './context';
import { ModelPickerBase } from './ModelPickerBase';
import type { ModelPickerProps } from './types';

/**
 * `ModelPicker` — NATIVE. The implementation is `ModelPickerBase`; this file
 * only binds the panel it opens in.
 */
export function ModelPicker(props: ModelPickerProps) {
  return (
    <ComposerPopoverContext.Provider value={ComposerPopover}>
      <ModelPickerBase {...props} />
    </ComposerPopoverContext.Provider>
  );
}
ModelPicker.displayName = 'ModelPicker';
