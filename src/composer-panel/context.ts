import { Button } from '../button/Button';
import { createContext, useContext, type ComponentType } from 'react';

import type * as DropdownMenuModule from '../dropdown-menu';

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
      'composer-panel: a menu rendered outside ComposerPanel / ModelPicker — import them from @oxy.so/bloom/composer-panel.',
    );
  }
  return Popover;
}

/** Platform bindings inject their actual Button, including its ref and layout contract. */
export const ComposerButtonContext = createContext<typeof Button>(Button);
export function useComposerButton() {
  return useContext(ComposerButtonContext);
}

/**
 * The menu base the add menu is built on: Bloom's `DropdownMenu` family, platform-forked, injected
 * by each binding like the popover. The shared implementation never names a platform file.
 */
export const ComposerDropdownContext = createContext<typeof DropdownMenuModule | null>(null);

export function useComposerDropdown(): typeof DropdownMenuModule {
  const Dropdown = useContext(ComposerDropdownContext);
  if (!Dropdown) {
    throw new Error(
      'composer-panel: the add menu rendered outside ComposerPanel / ComposerPill — import them from @oxy.so/bloom/composer-panel.',
    );
  }
  return Dropdown;
}
