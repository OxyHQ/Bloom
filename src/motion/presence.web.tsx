import { createElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';

import { LeavingContext, type Leaving } from './leaving';
import type { PresenceChildProps } from './leaving';

interface Kept {
  element: ReactElement;
  index: number;
  leave: Leaving;
}

interface PresenceState {
  rendered: readonly ReactElement[];
  leaving: ReadonlyMap<string, Kept>;
}

function canLeave(element: ReactElement): element is ReactElement & { key: string } {
  return element.key !== null && Boolean((element.props as PresenceChildProps).exit);
}

/**
 * Web: a keyed list that keeps a child after it left, for as long as its
 * removal plays. Each child that can leave (`exit`, keyed: by index a removal
 * and a reorder look the same) sits in a `LeavingContext` provider, so the
 * list stays one shape; while it leaves, the provider holds its `Leaving`, the
 * `MotionView` with an `exit` inside plays it, and the child drops when it
 * calls `onLeft()`. Nothing else in the child re-renders. A list with no such
 * child passes through.
 */
export function Presence({ items }: { items: readonly ReactNode[] }): ReactNode {
  const [state, setState] = useState<PresenceState>(() => ({ rendered: [], leaving: new Map() }));
  const current = items.filter(isValidElement) as ReactElement[];
  const tracked = state.leaving.size > 0 || current.some(canLeave) || state.rendered.some(canLeave);
  if (!tracked) return items;

  const keys = new Set(current.map((element) => element.key));
  if (!sameList(state.rendered, current)) {
    const leaving = new Map(state.leaving);
    for (const key of keys) if (key !== null) leaving.delete(key);
    state.rendered.forEach((element, index) => {
      if (canLeave(element) && !keys.has(element.key) && !leaving.has(element.key)) {
        const key = element.key;
        const leave: Leaving = {
          onLeft: () =>
            setState((now) => {
              if (!now.leaving.has(key)) return now;
              const next = new Map(now.leaving);
              next.delete(key);
              return { ...now, leaving: next };
            }),
        };
        leaving.set(key, { element, index, leave });
      }
    });
    setState({ rendered: current, leaving });
  }

  const wrap = (element: ReactElement, leave: Leaving | undefined) =>
    canLeave(element)
      ? createElement(LeavingContext.Provider, { key: element.key, value: leave }, element)
      : element;
  const out: ReactNode[] = current.map((element) => wrap(element, undefined));
  for (const [key, { element, index, leave }] of state.leaving) {
    if (!keys.has(key)) out.splice(Math.min(index, out.length), 0, wrap(element, leave));
  }
  return out;
}
Presence.displayName = 'BloomPresence';

function sameList(a: readonly ReactElement[], b: readonly ReactElement[]): boolean {
  return a.length === b.length && a.every((element, i) => element === b[i]);
}
