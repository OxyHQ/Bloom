import type { ConfirmOptions } from './types';

/**
 * Imperative confirm store.
 *
 * Mirrors the `dialog/alert-store` pattern: a module-scope queue + a single
 * subscriber (the `<AlertDialogHost />` mounted in the app tree). `confirm()`
 * enqueues an entry and resolves a promise with the user's choice. Entries
 * enqueued before the host mounts drain on subscribe — no lost confirms.
 */

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `bloom-confirm-${idCounter}`;
}

export interface ConfirmEntry extends ConfirmOptions {
  id: string;
  resolve: (confirmed: boolean) => void;
}

type Listener = (queue: ConfirmEntry[]) => void;

let queue: ConfirmEntry[] = [];
let listener: Listener | null = null;

function emit(): void {
  if (listener) listener(queue);
}

/**
 * Show a Bloom confirm dialog and resolve with the user's choice.
 *
 * ```ts
 * const ok = await confirm({
 *   title: 'Delete app?',
 *   description: 'This cannot be undone.',
 *   confirmLabel: 'Delete',
 *   destructive: true,
 * });
 * if (ok) await doDelete();
 * ```
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const id = genId();
    queue = [...queue, { ...options, id, resolve }];
    emit();
  });
}

/** Resolve and remove an entry. Called by the host on confirm/cancel/dismiss. */
export function resolveConfirm(id: string, confirmed: boolean): void {
  const entry = queue.find((e) => e.id === id);
  if (!entry) return;
  queue = queue.filter((e) => e.id !== id);
  entry.resolve(confirmed);
  emit();
}

/**
 * Subscribe to queue changes (single-subscriber model; latest wins). Delivers
 * the current queue synchronously so a freshly mounted host catches up.
 */
export function subscribeConfirms(fn: Listener): () => void {
  listener = fn;
  fn(queue);
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Inspect the current queue. Used by tests. */
export function getConfirmQueue(): readonly ConfirmEntry[] {
  return queue;
}
