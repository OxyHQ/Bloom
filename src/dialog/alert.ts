import {
  enqueueAlert,
  resolveButtons,
  type AlertButton,
} from './alert-store';

/**
 * Show a Bloom-styled confirmation dialog. Mirrors React Native's
 * `Alert.alert(title, message?, buttons?)` signature so existing call
 * sites migrate by changing the import only.
 *
 * If no buttons are passed, a single `OK` confirmation is rendered.
 *
 * The alert is enqueued in a module-scope store and rendered by
 * `<BloomDialogProvider>`. Calls made before the provider mounts are
 * queued and drained once the provider attaches — there is no fire-and-
 * forget loss window. Calls made when no provider is ever mounted are
 * silently queued forever; in development, mount the provider once at
 * the app root and the queue will catch up immediately.
 *
 * ```tsx
 * import { alert } from '@oxyhq/bloom';
 *
 * alert('Sign out?', 'You will need to enter your password to sign in again.', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Sign out', style: 'destructive', onPress: doSignOut },
 * ]);
 * ```
 */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  enqueueAlert({
    title,
    message,
    buttons: resolveButtons(buttons),
  });
}

export type { AlertButton, AlertButtonStyle } from './alert-store';
