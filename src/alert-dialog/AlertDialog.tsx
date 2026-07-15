import React, { memo, useCallback, useEffect, useRef } from 'react';

import type { DialogAction, DialogProps } from '../dialog';
import { useDialogControl } from '../dialog/context';
import type { AlertDialogProps } from './types';

type DialogComponent = React.ComponentType<DialogProps>;

/**
 * Build the `AlertDialog` component bound to a platform `Dialog`.
 *
 * `Dialog` is platform-forked (native `BottomSheet`-backed surface vs pure-DOM
 * web overlay) through its `./dialog` export conditions, and this repo never
 * relies on implicit `.web` resolution — the platform entry files
 * (`index.ts` / `index.web.ts`) inject the correct `Dialog` here. The body
 * below is single-source, no duplication.
 *
 * `AlertDialog` is a thin wrapper over `<Dialog placement="center">` that maps
 * the confirm/cancel props onto the Dialog's declarative `actions` row — the
 * SAME battle-tested `ActionRow`/`ActionButton` primitive every other bloom
 * confirm surface uses (e.g. Mention's `ConfirmPrompt`), so the button
 * component, layout, and palette stay identical across apps. Reach for the
 * imperative `confirm()` helper + `<AlertDialogHost />` to trigger a confirm
 * from an event handler without owning visible state.
 *
 * Control mode — IMPERATIVE, not controlled. `AlertDialog` keeps its public
 * *controlled* API (`visible` boolean + `onClose`) but internally bridges it
 * onto the Dialog's imperative `useDialogControl()` handle, so `confirm()`
 * drives `<Dialog>` through the EXACT uncontrolled/imperative internals
 * Mention's `ConfirmPrompt` uses. That is the code path that actually plays the
 * exit animation on dismiss: imperative `close()` sets `isClosing`, runs the
 * exit animation, and fires `onClose` only once it settles. The controlled path
 * instead fires `onClose` synchronously — and because `<AlertDialogHost />`
 * resolves + drops the queue entry inside `onClose`, the surface would then
 * unmount instantly, skipping the exit animation entirely. Bridging to
 * imperative mode eliminates that fork so `confirm()` and Mention's
 * `ConfirmPrompt` are pixel/timing identical.
 *
 * The centered card uses the Dialog default `maxWidth` (480px) for full visual
 * parity with the shared confirm surface.
 */
export function createAlertDialog(Dialog: DialogComponent) {
  const AlertDialogComponent = function AlertDialog({
    visible,
    onClose,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    destructive = false,
    hideCancel = false,
    dismissible = true,
    cardStyle,
    testID,
  }: AlertDialogProps) {
    const control = useDialogControl();

    // Bridge the public *controlled* `visible` prop onto the Dialog's
    // imperative open/close. Opening on mount straight from an effect (no
    // `setTimeout`) mirrors bloom's own `AutoMountedDialog` (which backs
    // `alert()`) — the canonical fresh-mount imperative-open pattern:
    // `<AlertDialogHost />` mounts a FRESH `AlertDialog` per confirm
    // (`key={id}`) with the final content already committed, so there is no
    // stale-content window to defer past and the entry animation curve stays
    // identical to Mention's. `control` is referentially stable (memoised on
    // its id), so this effect only re-runs when `visible` actually flips. When
    // a direct consumer flips `visible` to `false`, we imperatively `close()`
    // so the exit animation still plays.
    const closingFromPropRef = useRef(false);
    useEffect(() => {
      if (visible) {
        control.open();
        return;
      }
      closingFromPropRef.current = true;
      control.close();
    }, [visible, control]);

    // The Dialog fires `onClose` after the exit animation settles (imperative
    // mode). Forward ONLY user-initiated dismissals (backdrop / Escape / cancel)
    // to the consumer — a consumer-initiated close (they flipped `visible` to
    // `false`) must not re-enter `onClose`, preserving the previous controlled
    // semantics where a programmatic close does not fire `onClose`.
    const handleClose = useCallback(() => {
      if (closingFromPropRef.current) {
        closingFromPropRef.current = false;
        return;
      }
      onClose();
    }, [onClose]);

    // Confirm/cancel map onto the Dialog's declarative action row. Both keep the
    // default `shouldCloseOnPress` (true): the button runs the exit animation
    // FIRST, then invokes `onPress` as a close-completion callback — so
    // `onConfirm` resolves the `confirm()` promise as the surface animates out,
    // exactly like Mention. `onConfirm` (resolve `true`, drains the entry) runs
    // just BEFORE the Dialog's own post-close `onClose` (→ `handleClose` →
    // resolve `false`, now a no-op for the drained entry), which is what makes
    // the confirm button win the double-resolution guard.
    const actions: DialogAction[] = [
      {
        label: confirmLabel,
        onPress: onConfirm,
        color: destructive ? 'destructive' : 'default',
      },
    ];
    if (!hideCancel) {
      // The `cancel` color auto-dismisses via the Dialog's `close()` (exit
      // animation), then runs `onCancel` as a close-completion callback.
      actions.push({
        label: cancelLabel,
        onPress: onCancel,
        color: 'cancel',
      });
    }

    return (
      <Dialog
        control={control}
        onClose={handleClose}
        placement="center"
        // Alert dialogs dismiss on backdrop / Escape by default (matching the
        // shared Dialog default and Mention's `ConfirmPrompt`). A backdrop /
        // Escape dismissal can only ever resolve the confirm as cancelled
        // (`false`), never the destructive action — callers that need a truly
        // blocking confirm opt out with `dismissible={false}`.
        dismissOnBackdrop={dismissible}
        title={title}
        description={description}
        actions={actions}
        label={title}
        style={cardStyle}
        testID={testID}
      />
    );
  };

  const AlertDialog = memo(AlertDialogComponent);
  AlertDialog.displayName = 'AlertDialog';
  return AlertDialog;
}

export type AlertDialogType = ReturnType<typeof createAlertDialog>;
