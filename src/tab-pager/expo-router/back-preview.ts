/** The route/history fields owned by the tabs navigator. */
export interface BackPreviewState {
  key: string;
  index: number;
  routes: readonly { key: string; name: string }[];
  history?: readonly unknown[];
}

export interface TabBackPreview {
  /** Identifies the exact route/history pair shown by the native preview. */
  sessionKey: string;
  from: string;
  to: string;
}

function routeKey(entry: unknown): string | undefined {
  if (typeof entry !== 'object' || entry === null || !('type' in entry) || entry.type !== 'route')
    return undefined;
  return 'key' in entry && typeof entry.key === 'string' ? entry.key : undefined;
}

/**
 * Read the same last two route entries used by TabRouter's history back action.
 * Never invent an adjacent page or a Home fallback: exhausted history belongs
 * to the parent navigator/platform. This function does not change focus or
 * consume an entry; a cancelled gesture leaves the original state intact.
 */
export function tabBackPreview(state: BackPreviewState): TabBackPreview | null {
  const history = state.history ?? [];
  const current = state.routes[state.index];
  if (!current || history.length < 2 || routeKey(history[history.length - 1]) !== current.key)
    return null;
  const previousKey = routeKey(history[history.length - 2]);
  const previous = state.routes.find((route) => route.key === previousKey);
  if (!previous || previous.key === current.key) return null;
  return {
    sessionKey: JSON.stringify([
      state.key,
      current.key,
      state.routes.map((route) => [route.key, route.name]),
      history.map(routeKey),
    ]),
    from: current.name,
    to: previous.name,
  };
}
