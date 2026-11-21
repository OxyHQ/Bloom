import { useRef } from 'react';

/**
 * The same array for as long as its items are the same: a hook's deps for a
 * list whose length is the view's for its life (a view's bound values).
 */
export function useSameItems<T>(items: readonly T[]): readonly T[] {
  const held = useRef(items);
  const current = held.current;
  if (current.length !== items.length || current.some((item, i) => !Object.is(item, items[i]))) {
    held.current = items;
  }
  return held.current;
}
