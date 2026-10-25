/**
 * Bridge a Radix-shaped `open` / `onOpenChange` pair onto the IMPERATIVE dialog
 * control that `dialog/SheetShell` drives. NATIVE ONLY — the web forks render
 * their surface conditionally and need none of this.
 *
 * This is the same bridge `AlertDialog` makes, for the same reason, and it is
 * why the public API can be `open`/`onOpenChange` without any surface taking
 * `Dialog`'s controlled boolean path: the imperative `close()` runs the exit
 * animation and reports the dismissal only once it settles, while the
 * controlled path fires synchronously and races a consumer that unmounts in its
 * own handler.
 *
 * `presentedRef` is whether the SHEET is up, and only a presented sheet is
 * closed from state. It keeps the first commit quiet (a menu mounts closed, and
 * every menu on the screen would otherwise dismiss a sheet never presented),
 * and it keeps a USER dismissal from being closed a second time. That second
 * close used to happen on every backdrop tap: the dismissal reported
 * `open=false`, the effect then "closed" the already-closed sheet, which fires
 * no `onDismiss`, so `closingFromStateRef` stayed set; the NEXT user dismissal
 * was swallowed as if the consumer had asked for it, `onOpenChange(false)` never
 * came, and a controlled menu stayed `open` with no sheet on screen. In Allo,
 * after two backdrop taps, holding a message opened nothing until a restart.
 */
import { useCallback, useEffect, useRef } from 'react';

import { useDialogControl } from '../dialog/context';
import type { DialogControlProps } from '../dialog/types';

export interface SheetOpenBridge {
  /** Hand to `SheetShell`'s `control`. */
  control: DialogControlProps;
  /** Hand to `SheetShell`'s `onClose`. */
  onSheetClose: () => void;
}

export function useSheetOpenBridge(
  open: boolean,
  setOpen: (next: boolean) => void,
): SheetOpenBridge {
  const control = useDialogControl();
  const presentedRef = useRef(false);
  // A close the CONSUMER asked for (they flipped `open` to false) must not
  // re-enter `onOpenChange` when the sheet finishes animating out — only a
  // user-initiated dismissal (drag down, handle tap, backdrop) reports back.
  const closingFromStateRef = useRef(false);

  useEffect(() => {
    if (open) {
      presentedRef.current = true;
      control.open();
      return;
    }
    // Never presented, or the user already dismissed it: nothing to close.
    if (!presentedRef.current) return;
    presentedRef.current = false;
    closingFromStateRef.current = true;
    control.close();
  }, [open, control]);

  const onSheetClose = useCallback(() => {
    if (closingFromStateRef.current) {
      closingFromStateRef.current = false;
      return;
    }
    presentedRef.current = false;
    setOpen(false);
  }, [setOpen]);

  return { control, onSheetClose };
}
