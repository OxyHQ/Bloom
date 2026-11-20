import { afterFrame } from './environment';
import { currentStore, withStore } from './root';
import { reportError, type Store } from './store';

/** What `realtime` needs of a socket: socket.io's `on` and `off`. */
export interface EventSocket {
  // biome-ignore lint/suspicious/noExplicitAny: socket listeners take any payload
  on(event: string, listener: (payload: any) => void): unknown;
  // biome-ignore lint/suspicious/noExplicitAny: socket listeners take any payload
  off(event: string, listener: (payload: any) => void): unknown;
}

// biome-ignore lint/suspicious/noExplicitAny: each event has its own payload type
export type RealtimeHandlers = Readonly<Record<string, (payload: any) => void>>;

/**
 * Writes a socket's events into the same entities and lists the sources
 * fill. Events are queued as they arrive and applied together after the next
 * frame, in arrival order, with one notification: a burst of engagement
 * events wakes each reader once, and the newest value of each field is the
 * one left standing.
 *
 * Each event is applied to the store that was in scope when it arrived; if
 * that store was closed meanwhile (an account switch), the event is dropped.
 * Returns the unsubscribe.
 */
export function realtime(socket: EventSocket, handlers: RealtimeHandlers): () => void {
  const queue: Array<{ store: Store; handler: (payload: unknown) => void; payload: unknown }> = [];
  let cancel: (() => void) | undefined;

  const flush = () => {
    cancel = undefined;
    const events = queue.splice(0);
    const stores = new Set(events.map((event) => event.store));
    for (const store of stores) {
      if (store.closed) continue;
      store.batch(() => {
        for (const event of events) {
          if (event.store !== store) continue;
          try {
            withStore(store, () => event.handler(event.payload));
          } catch (error) {
            reportError(error);
          }
        }
      });
    }
  };

  const listeners = Object.entries(handlers).map(([event, handler]) => {
    const listener = (payload: unknown) => {
      queue.push({ store: currentStore(), handler, payload });
      cancel ??= afterFrame(flush);
    };
    socket.on(event, listener);
    return [event, listener] as const;
  });

  return () => {
    for (const [event, listener] of listeners) {
      socket.off(event, listener);
    }
    cancel?.();
    cancel = undefined;
    queue.length = 0;
  };
}
