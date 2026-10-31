/** Shared across package entry points, like the overlay stacking registry. */
interface BackOwnership {
  owners: Set<symbol>;
  listeners: Set<() => void>;
}
declare global {
  var __oxy_so_bloom_back_ownership__: BackOwnership | undefined;
}
function registry(): BackOwnership {
  globalThis.__oxy_so_bloom_back_ownership__ ??= {
    owners: new Set(),
    listeners: new Set(),
  };
  return globalThis.__oxy_so_bloom_back_ownership__;
}

/** An overlay or compact drawer owns Back before the underlying navigator. */
export function acquireBackOwnership(): () => void {
  const state = registry();
  const owner = Symbol();
  state.owners.add(owner);
  for (const notify of state.listeners) notify();
  return () => {
    if (!state.owners.delete(owner)) return;
    for (const notify of state.listeners) notify();
  };
}

export const hasBackOwner = (): boolean => registry().owners.size > 0;
export function subscribeBackOwnership(notify: () => void): () => void {
  registry().listeners.add(notify);
  return () => registry().listeners.delete(notify);
}
