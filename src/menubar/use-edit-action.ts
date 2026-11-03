/**
 * A `MenubarItem`'s standard editing `action`, sent to the first responder
 * (OxyOS ADR 0021, decision 3; ADR 0037).
 *
 * THE RESPONDER CHAIN, AS A MAC'S. A Mac's Edit menu items are nil-targeted
 * actions (`copy:`, `paste:`): AppKit sends each to the key window's first
 * responder, and validates the item there (`validateMenuItem:`), so Edit ›
 * Copy copies the focused field's selection and is disabled in a field with
 * none. Android's `EditText` takes the same commands from its own menus
 * (`onTextContextMenuItem(android.R.id.copy)`). Here the platform's `editing`
 * is that first responder: the focused text field, whatever component draws it
 * (Bloom's `TextField`, a bare `TextInput`), which only the platform knows,
 * with what it can do now.
 *
 *  - A text field focused: it is the item's target. The item is enabled
 *    exactly when the field can perform the action now, and choosing it
 *    performs it there, never the item's own `onPress`.
 *  - None focused (or no `editing`): the item is the application's, further
 *    down the chain: its `onPress` (or `href`) and `disabled`, and disabled
 *    when it has neither, as an action no responder implements.
 *
 * What runs is decided when the item runs, from the state then, not from the
 * last render, so a choice can never reach a field that has since lost focus.
 */
import { useCallback, useSyncExternalStore } from 'react';

import { usePlatformEditing } from '../platform-surface/context';
import type { PlatformEditAction, PlatformEditing } from '../platform-surface/types';

/** Each action's standard chord, as a Mac's Edit menu has it; Delete has none. */
export const EDIT_ACTION_SHORTCUTS: Readonly<Record<PlatformEditAction, string | undefined>> = {
  undo: 'Mod+Z',
  redo: 'Mod+Shift+Z',
  cut: 'Mod+X',
  copy: 'Mod+C',
  paste: 'Mod+V',
  pasteAndMatchStyle: 'Mod+Alt+Shift+V',
  delete: undefined,
  selectAll: 'Mod+A',
};

const subscribeNowhere = () => () => undefined;

/** What a field can do with `action` now: 'none' with no field focused. */
type Responder = 'none' | 'enabled' | 'disabled';

function responderOf(
  editing: PlatformEditing | null,
  action: PlatformEditAction | undefined,
): Responder {
  if (!editing || !action) return 'none';
  const state = editing.getState();
  if (!state) return 'none';
  return state[action] ? 'enabled' : 'disabled';
}

export interface EditActionItem {
  /** Whether the item can be chosen now. */
  readonly enabled: boolean;
  /** Runs the item: the field's action while one is focused, else the item's own handler. */
  readonly run: () => void;
}

/**
 * The item's state and what choosing it does, for an item with `action`; for
 * one without, its own `disabled` and `handler`. `handler` is the item's own
 * (`onPress`, or following its `href`), undefined when it has neither.
 */
export function useEditAction(
  action: PlatformEditAction | undefined,
  disabled: boolean,
  handler: (() => void) | undefined,
): EditActionItem {
  const editing = usePlatformEditing();
  const listen = useCallback(
    (listener: () => void) =>
      editing && action ? editing.subscribe(listener) : subscribeNowhere(),
    [editing, action],
  );
  const responder = useSyncExternalStore(
    listen,
    () => responderOf(editing, action),
    () => 'none' as const,
  );
  const run = useCallback(() => {
    if (action && editing && responderOf(editing, action) !== 'none') {
      editing.perform(action);
      return;
    }
    handler?.();
  }, [action, editing, handler]);
  if (responder !== 'none') return { enabled: responder === 'enabled', run };
  return { enabled: !disabled && (action === undefined || handler !== undefined), run };
}
