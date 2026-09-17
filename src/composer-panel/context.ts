import { createContext, useContext, type ComponentType } from 'react';

import type { ComposerPopoverProps } from './types';

/**
 * The anchored panel the family's menus open in, injected by each platform
 * binding (`ComposerPanel.tsx` / `ComposerPanel.web.tsx`, and the same pair for
 * `ModelPicker` and `ComposerAttachments`), so each platform binds the shared
 * base to its own panel. The shared implementation never names a
 * platform file, so a web bundler that resolves `package.json#exports` (and not
 * Metro's platform extensions) still reaches the web panel through the family's
 * `browser` condition.
 */
export const ComposerPopoverContext = createContext<ComponentType<ComposerPopoverProps> | null>(
  null,
);

export function useComposerPopover(): ComponentType<ComposerPopoverProps> {
  const Popover = useContext(ComposerPopoverContext);
  if (!Popover) {
    throw new Error(
      'composer-panel: a menu rendered outside ComposerPanel / ModelPicker — import them from @oxyhq/bloom/composer-panel.',
    );
  }
  return Popover;
}
