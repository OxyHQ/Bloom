/** The tabs navigator's state, reduced to the fields a leave rewrites. */
export interface LeavableTabState {
  index: number;
  routes: readonly { key: string; name: string }[];
  history?: readonly unknown[];
}

const historyKey = (entry: unknown): string | undefined =>
  typeof entry === 'object' && entry !== null && 'key' in entry && typeof entry.key === 'string'
    ? entry.key
    : undefined;

/**
 * The tabs state after leaving page `from` for page `to`, with `from` removed
 * from the back history.
 *
 * A plain switch only re-orders the history (`[index, write]` becomes
 * `[write, index]`), so the page being left stays one Back away — for a
 * composer that just published, a duplicate post waiting to happen. Every other
 * field passes through untouched. `null` when either name has no route, so the
 * caller falls back to an ordinary switch.
 */
export function stateLeavingTab<S extends LeavableTabState>(
  state: S,
  from: string,
  to: string,
): S | null {
  const toIndex = state.routes.findIndex((route) => route.name === to);
  const left = state.routes.find((route) => route.name === from);
  const target = state.routes[toIndex];
  if (!left || !target) return null;
  const history = (state.history ?? []).filter((entry) => {
    const key = historyKey(entry);
    return key !== left.key && key !== target.key;
  });
  return { ...state, index: toIndex, history: [...history, { type: 'route', key: target.key }] };
}
