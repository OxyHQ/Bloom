import React, { useEffect, useState } from 'react';

import { AutoMountedDialog } from './Dialog.web';
import {
  buttonToAction,
  dismissAlert,
  subscribeAlerts,
  type AlertEntry,
} from './alert-store';

/**
 * Web variant of `BloomDialogProvider`. Identical surface area to the
 * native version — it just uses the web-fork `Dialog` (`Dialog.web.tsx`)
 * underneath instead of the bottom-sheet variant.
 *
 * See the native file (`./BloomDialogProvider.tsx`) for the full design
 * notes; this fork exists purely so the bundler's `browser` condition can
 * resolve to a `Dialog` that doesn't pull in the native gesture-handler /
 * reanimated stack.
 */
export function BloomDialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<readonly AlertEntry[]>([]);

  useEffect(() => subscribeAlerts(setQueue), []);

  const head = queue[0];

  return (
    <>
      {children}
      {head ? <AlertHost key={head.id} entry={head} /> : null}
    </>
  );
}

function AlertHost({ entry }: { entry: AlertEntry }) {
  const actions = entry.buttons.map(buttonToAction);
  return (
    <AutoMountedDialog
      title={entry.title}
      description={entry.message}
      actions={actions}
      onResolve={() => dismissAlert(entry.id)}
    />
  );
}
