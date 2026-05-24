import type { DialogAction } from './types';

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `bloom-alert-${idCounter}`;
}

/**
 * Imperative-alert store.
 *
 * The store sits in module scope so `alert()` works from anywhere — event
 * handlers, async callbacks, top-level helpers — without threading a
 * provider context through every call site.
 *
 * The visible UI is owned by a single subscriber (the `<BloomDialogProvider>`
 * mounted inside the app's React tree). When there is no subscriber yet —
 * because `alert()` was called before the provider mounted, or because the
 * app forgot to mount the provider — entries accumulate in the queue and
 * drain as soon as a subscriber attaches.
 *
 * Multiple subscribers are not supported by design. Two providers would
 * race for the same alert; we instead enforce a single listener and let
 * the most recent subscription win (the older one falls back to no-op).
 */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  /** Button label. Required. */
  text: string;
  /** Tap handler. Invoked after the dialog has finished its close animation. */
  onPress?: () => void;
  /** Visual treatment. Defaults to `'default'`. */
  style?: AlertButtonStyle;
}

export interface AlertEntry {
  id: string;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (queue: AlertEntry[]) => void;

let queue: AlertEntry[] = [];
let listener: Listener | null = null;

function emit(): void {
  if (listener) listener(queue);
}

/**
 * Enqueue an alert. Returns the generated id so callers can dismiss it
 * imperatively (rare — usually the dialog dismisses itself via a button
 * tap). The runtime guarantees this enqueues even before any provider
 * mounts; the provider drains pending entries on subscribe.
 */
export function enqueueAlert(entry: Omit<AlertEntry, 'id'>): string {
  const id = genId();
  queue = [...queue, { ...entry, id }];
  emit();
  return id;
}

/**
 * Remove an alert from the queue. Called by the provider once the bloom
 * Dialog has finished closing for that entry.
 */
export function dismissAlert(id: string): void {
  const next = queue.filter((e) => e.id !== id);
  if (next.length === queue.length) return;
  queue = next;
  emit();
}

/**
 * Subscribe to queue changes. Replaces any previously-registered listener
 * (single-subscriber model — see header). Returns an unsubscribe function.
 *
 * On subscribe, the current queue is delivered synchronously so the
 * subscriber can render pending entries that arrived before mount.
 */
export function subscribeAlerts(fn: Listener): () => void {
  listener = fn;
  // Deliver the current queue immediately so a freshly-mounted provider
  // catches up with whatever accumulated before it subscribed.
  fn(queue);
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Inspect the current queue. Used internally and by tests. */
export function getAlertQueue(): readonly AlertEntry[] {
  return queue;
}

/**
 * Translate an alert button to the action shape the unified `Dialog`
 * accepts. Pure — no React, no theme — so it can be reused on web and
 * native without forking.
 */
export function buttonToAction(button: AlertButton): DialogAction {
  return {
    label: button.text,
    onPress: button.onPress ? () => button.onPress?.() : undefined,
    color:
      button.style === 'destructive'
        ? 'destructive'
        : button.style === 'cancel'
          ? 'cancel'
          : 'default',
  };
}

/**
 * Compute the effective button set for an alert. Mirrors React Native's
 * `Alert.alert` semantics — an empty/omitted buttons array implies a
 * single `OK` confirmation button.
 */
export function resolveButtons(buttons: AlertButton[] | undefined): AlertButton[] {
  if (buttons && buttons.length > 0) return buttons;
  return [{ text: 'OK', style: 'default' }];
}
