import React, { useEffect, useState } from 'react';

import {
  resolveConfirm,
  subscribeConfirms,
  type ConfirmEntry,
} from './confirm-store';
import type { AlertDialogType } from './AlertDialog';

/**
 * Build the `<AlertDialogHost />` bound to a platform `AlertDialog`. The
 * platform entry files (`index.ts` / `index.web.ts`) inject the correct one.
 *
 * The host mounts the imperative `confirm()` UI. Wrap your app root once
 * (after `BloomThemeProvider`) and you can call `confirm()` from anywhere —
 * including before the host mounts (entries are queued and drained on
 * subscribe). Confirms present one at a time in FIFO order.
 */
export function createAlertDialogHost(AlertDialog: AlertDialogType) {
  function ConfirmHost({ entry }: { entry: ConfirmEntry }) {
    return (
      <AlertDialog
        visible
        title={entry.title}
        description={entry.description}
        confirmLabel={entry.confirmLabel}
        cancelLabel={entry.cancelLabel}
        destructive={entry.destructive}
        hideCancel={entry.hideCancel}
        dismissible={entry.dismissible}
        onConfirm={() => resolveConfirm(entry.id, true)}
        onCancel={() => resolveConfirm(entry.id, false)}
        onClose={() => resolveConfirm(entry.id, false)}
      />
    );
  }

  function AlertDialogHost() {
    const [queue, setQueue] = useState<readonly ConfirmEntry[]>([]);

    useEffect(() => subscribeConfirms(setQueue), []);

    const head = queue[0];
    if (!head) return null;

    return <ConfirmHost key={head.id} entry={head} />;
  }
  AlertDialogHost.displayName = 'AlertDialogHost';

  return AlertDialogHost;
}
