import type { Persister } from './persist';
import { Store, type StoreOptions } from './store';

/**
 * Which store a call acts on.
 *
 * Hooks read the store from `DataProvider` context. Calls made outside React
 * (an action, a realtime handler, a source) act on the store in scope: the
 * one a running action, handler or load captured when it started, else the
 * active store. That capture is what keeps an answer for account A out of
 * account B's store after a switch.
 */

let active: Store | undefined;
let scoped: Store | undefined;

/** The store a call outside React acts on. Makes a memory-only store if none is open. */
export function currentStore(): Store {
  if (scoped) return scoped;
  active ??= new Store();
  return active;
}

/** The active store, if one was opened or made. */
export function activeStore(): Store | undefined {
  return active;
}

/** Makes `store` the one calls outside React act on. */
export function setActiveStore(store: Store | undefined): void {
  active = store;
}

/** Runs `fn` with `store` in scope (synchronously). */
export function withStore<T>(store: Store, fn: () => T): T {
  const outer = scoped;
  scoped = store;
  try {
    return fn();
  } finally {
    scoped = outer;
  }
}

/**
 * One store per account, each with its own durable copy (one SQLite file per
 * account), swapped when the signed-in account changes.
 */
export interface Accounts {
  /** The open account's store. */
  readonly store: Store | undefined;
  readonly account: string | undefined;
  /**
   * Opens `account`'s store and makes it active. The previous store closes:
   * its queued writes reach its own file, and later writes to it are dropped.
   */
  open(account: string): Store;
  close(): Promise<void>;
  /**
   * Forgets an account on this device: closes its store if it is open, then
   * deletes its durable copy. For sign-out, so nothing of the account stays
   * behind.
   */
  forget(account: string): Promise<void>;
}

export interface AccountOptions extends Omit<StoreOptions, 'persister'> {
  /** The account's durable copy, or none (web). */
  persister?: (account: string) => Persister | undefined;
}

export function createAccounts(options: AccountOptions = {}): Accounts {
  let store: Store | undefined;
  let account: string | undefined;
  return {
    get store() {
      return store;
    },
    get account() {
      return account;
    },
    open(next) {
      if (store && account === next && !store.closed) return store;
      const previous = store;
      store = new Store({ ...options, persister: options.persister?.(next) });
      account = next;
      setActiveStore(store);
      void previous?.close();
      return store;
    },
    async close() {
      const previous = store;
      store = undefined;
      account = undefined;
      if (active === previous) setActiveStore(undefined);
      await previous?.close();
    },
    async forget(forgotten) {
      if (account === forgotten) await this.close();
      await options.persister?.(forgotten)?.destroy();
    },
  };
}
