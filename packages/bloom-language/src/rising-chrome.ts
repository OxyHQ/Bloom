/**
 * A screen's chrome set by any view it draws, as SwiftUI's `navigationTitle` and `toolbar` are
 * preferences that rise from a descendant: `PostDetail().title(post.title)` drawn deep in a
 * screen's body titles the screen. The screen (`ScreenHost`) provides a store; each drawn view
 * whose body (or whose own call) declares chrome writes it there in a layout effect, and the
 * screen reads the store for what its root does not say itself. A write re-renders the screen's
 * chrome only: its content is the same element, which React does not draw again.
 */
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import { isNode, type Child, type Node } from './node';

/** The chrome a descendant view may set: the header's, never what a node takes as its own. */
export const RISING_KEYS = [
  'title',
  'titleDisplay',
  'subtitle',
  'toolbar',
  'toolbarLeading',
  'backLabel',
  'scrollEdge',
] as const;

/** Nodes whose `title` / `subtitle` are their own (a menu section's, a settings row's). */
const OWN_TITLES: ReadonlySet<string> = new Set([
  'menuSection',
  'menuItem',
  'settingsItem',
  'header',
  'dialog',
]);

export type RisingValues = Readonly<Record<string, unknown>>;

export interface RisingStore {
  set(token: object, values: RisingValues | undefined): void;
  subscribe(listener: () => void): () => void;
  snapshot(): RisingValues;
}

const NONE: RisingValues = Object.freeze({});

export function createRisingStore(): RisingStore {
  const entries = new Map<object, RisingValues>();
  const listeners = new Set<() => void>();
  let merged: RisingValues = NONE;
  const remerge = () => {
    const next: Record<string, unknown> = {};
    // Layout effects run inner views first: a later (outer) view's value wins, as SwiftUI's
    // outer preference does.
    for (const values of entries.values()) Object.assign(next, values);
    const keys = Object.keys(next);
    const same =
      keys.length === Object.keys(merged).length &&
      keys.every((key) => Object.is(next[key], merged[key]));
    if (same) return;
    merged = keys.length === 0 ? NONE : next;
    for (const listener of listeners) listener();
  };
  return {
    set(token, values) {
      if (values === undefined) {
        // Most views declare no chrome: nothing to do.
        if (!entries.delete(token)) return;
      } else {
        if (entries.get(token) === values) return;
        entries.set(token, values);
      }
      remerge();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => merged,
  };
}

export const RisingContext = createContext<RisingStore | null>(null);

/** The rising chrome a node declares, or none. */
export function risingOf(node: Child): RisingValues | undefined {
  if (!isNode(node) || OWN_TITLES.has(node.kind)) return undefined;
  let out: Record<string, unknown> | undefined;
  for (const modifier of (node as Node).modifiers) {
    if ((RISING_KEYS as readonly string[]).includes(modifier.kind)) {
      out ??= {};
      out[modifier.kind] = 'value' in modifier ? modifier.value : true;
    }
  }
  return out;
}

/**
 * Writes `values` into the screen above, for as long as the caller is drawn. The caller's token
 * lasts its life, so a new render updates its place in the order and only unmounting removes it.
 */
export function useRisingChrome(values: RisingValues | undefined): void {
  const store = useContext(RisingContext);
  const token = useRef<object>(null);
  token.current ??= {};
  useLayoutEffect(() => {
    if (store !== null && token.current !== null) store.set(token.current, values);
  }, [store, values]);
  useLayoutEffect(() => {
    const own = token.current;
    return () => {
      if (store !== null && own !== null) store.set(own, undefined);
    };
  }, [store]);
}

function Rising({ values, children }: { values: RisingValues; children: ReactNode }): ReactNode {
  useRisingChrome(values);
  return children;
}

/** `element` writing `values` into the screen above while it is drawn. */
export function rising(values: RisingValues, element: ReactNode, key?: string | number): ReactNode {
  return createElement(Rising, { values, key, children: element });
}
