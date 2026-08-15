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
 * `openedOnceRef` keeps the first commit quiet. A menu is mounted closed and
 * stays that way until pressed, so without it every menu on the screen would
 * call `dismiss()` on a sheet that was never presented, on every mount.
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
  const openedOnceRef = useRef(false);
  // A close the CONSUMER asked for (they flipped `open` to false) must not
  // re-enter `onOpenChange` when the sheet finishes animating out — only a
  // user-initiated dismissal (drag down, handle tap, backdrop) reports back.
  const closingFromStateRef = useRef(false);

  useEffect(() => {
    if (open) {
      openedOnceRef.current = true;
      control.open();
      return;
    }
    if (!openedOnceRef.current) return;
    closingFromStateRef.current = true;
    control.close();
  }, [open, control]);

  const onSheetClose = useCallback(() => {
    if (closingFromStateRef.current) {
      closingFromStateRef.current = false;
      return;
    }
    setOpen(false);
  }, [setOpen]);

  return { control, onSheetClose };
}
