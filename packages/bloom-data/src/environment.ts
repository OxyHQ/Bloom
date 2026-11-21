/**
 * What the data layer needs to know about the device: whether it is online,
 * whether the app is in front, and when the next frame is.
 *
 * On web both signals come from the browser once a store opens. Native apps
 * report them (NetInfo and AppState) with `setOnline` and `setFocused`; until
 * they do, the device counts as online and in front. Nothing here runs at
 * import, so a server render touches no browser API.
 */

/** Every change is told: a banner needs going offline as much as a read needs coming back. */
export type EnvironmentEvent = 'online' | 'offline' | 'focus' | 'blur';
type EnvironmentListener = (event: EnvironmentEvent) => void;

let online = true;
let focused = true;
let browserConnected = false;
const listeners = new Set<EnvironmentListener>();

export const environment = {
  get online(): boolean {
    return online;
  },
  get focused(): boolean {
    return focused;
  },
  /** Report connectivity. Going online resumes paused reads and refetches stale ones. */
  setOnline(next: boolean): void {
    if (online === next) return;
    online = next;
    emit(next ? 'online' : 'offline');
  },
  /** Report whether the app is in front. Coming to the front refetches stale reads. */
  setFocused(next: boolean): void {
    if (focused === next) return;
    focused = next;
    emit(next ? 'focus' : 'blur');
  },
  subscribe(listener: EnvironmentListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

function emit(event: EnvironmentEvent): void {
  for (const listener of [...listeners]) listener(event);
}

/** Listens to the browser's own signals, once, when there is a browser. */
export function connectBrowserEnvironment(): void {
  if (browserConnected) return;
  const win = typeof window === 'undefined' ? undefined : window;
  const doc = typeof document === 'undefined' ? undefined : document;
  if (!win?.addEventListener || !doc) return;
  browserConnected = true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) online = false;
  win.addEventListener('online', () => environment.setOnline(true));
  win.addEventListener('offline', () => environment.setOnline(false));
  doc.addEventListener('visibilitychange', () =>
    environment.setFocused(doc.visibilityState !== 'hidden'),
  );
}

/** Runs `callback` after the next frame; returns a cancel. */
export function afterFrame(callback: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(callback, 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timer !== undefined) clearTimeout(timer);
    };
  }
  const timer = setTimeout(callback, 16);
  return () => clearTimeout(timer);
}

/** Resolves once `ready()` holds, re-checking on every environment event; rejects on abort. */
export function waitUntil(ready: () => boolean, signal: AbortSignal): Promise<void> {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const stop = environment.subscribe(() => {
      if (!ready()) return;
      cleanup();
      resolve();
    });
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    const cleanup = () => {
      stop();
      signal.removeEventListener('abort', onAbort);
    };
    signal.addEventListener('abort', onAbort);
  });
}

/** Resolves after `ms`; rejects on abort. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Test seam: back to online and in front, without telling anyone. */
export function resetEnvironmentForTests(): void {
  online = true;
  focused = true;
}
