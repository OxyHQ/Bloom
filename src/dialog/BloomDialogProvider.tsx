import React, { useEffect, useState } from 'react';

import { AutoMountedDialog } from './Dialog';
import {
  buttonToAction,
  dismissAlert,
  subscribeAlerts,
  type AlertEntry,
} from './alert-store';

/**
 * Mounts the imperative `alert()` host inside your app.
 *
 * Wrap your app root once (after `BloomThemeProvider`, so the dialog's
 * colours come from the active theme) and you can call `alert()` from
 * anywhere — including from code that runs before the provider mounts
 * (alerts are queued and drained on subscribe).
 *
 * ```tsx
 * import { BloomDialogProvider } from '@oxyhq/bloom';
 *
 * <BloomThemeProvider mode="system" colorPreset="oxy">
 *   <BloomDialogProvider>
 *     <App />
 *   </BloomDialogProvider>
 * </BloomThemeProvider>
 * ```
 *
 * Alerts are presented one at a time. While one is on screen, subsequent
 * `alert()` calls enqueue and present in FIFO order once their predecessor
 * has finished closing.
 */
export function BloomDialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<readonly AlertEntry[]>([]);

  useEffect(() => subscribeAlerts(setQueue), []);

  // Only the head of the queue is presented; this keeps the bottom-sheet
  // exit/enter animations clean and matches the platform `Alert.alert`
  // behaviour our consumers expect.
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
