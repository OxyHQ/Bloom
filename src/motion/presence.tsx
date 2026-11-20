import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';

/** What a `Presence` hands a child that left: call `onLeft` when its removal has played. */
export interface Leaving {
  readonly onLeft: () => void;
}

/** The props a child takes to be kept by a `Presence` while it leaves. */
export interface PresenceChildProps {
  /** Set: the child may leave with a removal of its own. */
  exit?: boolean;
  /** Set by the `Presence` while the child leaves. */
  leaving?: Leaving;
}

interface PresenceState {
  rendered: readonly ReactElement[];
  leaving: ReadonlyMap<string, { element: ReactElement; index: number }>;
}

function canLeave(element: ReactElement): boolean {
  return element.key !== null && Boolean((element.props as PresenceChildProps).exit);
}

/**
 * A keyed list that keeps a child after it left, for as long as its removal
 * plays: the child is cloned with `leaving`, and drops when it calls
 * `leaving.onLeft()`. Only keyed children with `exit` can leave (by index a
 * removal and a reorder look the same); a list with none passes through.
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
      if (
        element.key !== null &&
        !keys.has(element.key) &&
        canLeave(element) &&
        !leaving.has(element.key)
      ) {
        leaving.set(element.key, { element, index });
      }
    });
    setState({ rendered: current, leaving });
  }

  const out: ReactNode[] = [...current];
  for (const [key, { element, index }] of state.leaving) {
    if (keys.has(key)) continue;
    const leave: Leaving = {
      onLeft: () =>
        setState((now) => {
          if (!now.leaving.has(key)) return now;
          const next = new Map(now.leaving);
          next.delete(key);
          return { ...now, leaving: next };
        }),
    };
    out.splice(
      Math.min(index, out.length),
      0,
      cloneElement(element as ReactElement<PresenceChildProps>, { leaving: leave }),
    );
  }
  return out;
}
Presence.displayName = 'BloomPresence';

function sameList(a: readonly ReactElement[], b: readonly ReactElement[]): boolean {
  return a.length === b.length && a.every((element, i) => element === b[i]);
}
