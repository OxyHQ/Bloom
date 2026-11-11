import { useEffect, useRef } from 'react';

import { createStorage } from '../storage';
import { present } from '../surfaces';
import { NotificationPermissionSheet } from './NotificationPermissionSheet';
import type { NotificationPermissionGateProps } from './types';

/**
 * Asks for notification permission once the app is on screen: after `delayMs`,
 * if the permission is not granted and the person has not already said "Not now",
 * a Bloom sheet on the app's surface stack explains why and offers "Enable". It
 * renders nothing itself; mount it once, in the root layout, when the app is
 * ready.
 *
 * ```tsx
 * <NotificationPermissionGate
 *   permission={expoNotificationPermission}
 *   storage={AsyncStorage}
 *   onGranted={registerPushToken}
 * />
 * ```
 *
 * Needs the surface stack (`BloomProvider` mounts it). Callbacks are read at the
 * moment they fire, so passing inline functions does not restart the delay.
 */
export function NotificationPermissionGate(props: NotificationPermissionGateProps) {
  const {
    delayMs = 3000,
    enabled = true,
    permission,
    storage,
    storageKey = 'notification-permission-prompt',
    repromptAfterMs = Number.POSITIVE_INFINITY,
    askWhenDenied = false,
  } = props;
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      let status: Awaited<ReturnType<typeof permission.getStatus>>;
      try {
        status = await permission.getStatus();
      } catch {
        return;
      }
      if (cancelled || status === 'granted' || (status === 'denied' && !askWhenDenied)) return;
      const store = createStorage('', { adapter: storage });
      const declinedAt = await store.get<number>(storageKey);
      if (cancelled || (declinedAt !== null && Date.now() - declinedAt < repromptAfterMs)) return;
      const result = await present<string | undefined>(
        (surface) => {
          const current = latest.current;
          return (
            <NotificationPermissionSheet
              surface={surface}
              permission={permission}
              icon={current.icon}
              title={current.title}
              body={current.body}
              enableLabel={current.enableLabel}
              laterLabel={current.laterLabel}
              onGranted={() => latest.current.onGranted?.()}
              onDenied={() => latest.current.onDenied?.()}
              onDismissed={() => latest.current.onDismissed?.()}
            />
          );
        },
        { placement: 'bottom' },
      );
      // Anything but a grant counts as an answer: "Not now", a refusal, a swipe away.
      if (result !== 'granted') await store.set(storageKey, Date.now());
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [enabled, delayMs, permission, storage, storageKey, repromptAfterMs, askWhenDenied]);

  return null;
}
