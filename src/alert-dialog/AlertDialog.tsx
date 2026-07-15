import React, { memo, useCallback } from 'react';

import type { DialogAction, DialogProps } from '../dialog';
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
    dismissible = false,
    cardStyle,
    testID,
  }: AlertDialogProps) {
    // Confirm resolves + closes SYNCHRONOUSLY, in this order, and must NOT go
    // through the Dialog's auto-close (`shouldCloseOnPress: false`). In
    // controlled mode `close()` fires `onClose` FIRST, and the `confirm()` host
    // wires `onClose` to resolve the promise as *cancelled* (`false`). Running
    // `onConfirm` (resolve `true`, which removes the queue entry) before
    // `onClose` (now a no-op for that entry) is what makes the confirm button
    // resolve `true`.
    const handleConfirm = useCallback(() => {
      onConfirm?.();
      onClose();
    }, [onConfirm, onClose]);

    const actions: DialogAction[] = [
      {
        label: confirmLabel,
        onPress: handleConfirm,
        color: destructive ? 'destructive' : 'default',
        shouldCloseOnPress: false,
      },
    ];
    if (!hideCancel) {
      // The `cancel` color auto-dismisses via the Dialog's `close()`, which in
      // controlled mode fires `onClose` (the host resolves `false`). `onCancel`
      // runs after the surface finishes closing.
      actions.push({
        label: cancelLabel,
        onPress: onCancel,
        color: 'cancel',
      });
    }

    return (
      <Dialog
        open={visible}
        onClose={onClose}
        placement="center"
        // Alert dialogs are blocking by default — the backdrop / Escape only
        // dismiss when the caller opts in via `dismissible`.
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
