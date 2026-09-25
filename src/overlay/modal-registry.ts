/**
 * Which MODAL overlays are open right now, as a subscribable store.
 *
 * ## Why this exists
 *
 * A modal surface has to keep a screen reader inside it. iOS can do that from
 * the overlay's side: `accessibilityViewIsModal` on the `OverlayRoot` hides its
 * siblings, and at the native portal outlet the app content IS a sibling.
 * Android has no equivalent. TalkBack keeps walking into the app behind the
 * open surface (OxyHQ/Mention#1126: the Home feed stayed reachable under the
 * settings modal), and the only switch that stops it —
 * `importantForAccessibility="no-hide-descendants"` — has to sit ON the app
 * content. A portaled surface cannot reach that view: the outlet renders it as
 * the content's sibling, not its ancestor.
 *
 * So the knowledge travels the other way. Every `OverlayRoot` with `modal`
 * registers here while it is mounted, and `OverlayInertBoundary` — which the
 * app wraps around its own content — subscribes and hides what it wraps while
 * anything modal is open.
 *
 * Non-modal overlays (menus, popovers, tooltips, toasts, the shell drawers)
 * never register: the content under an anchored menu must stay reachable.
 *
 * Tokens rather than a counter so StrictMode's mount/unmount/remount and an
 * unmatched release can never drift the count: a token is either in the set or
 * not.
 */

interface ModalRegistry {
  live: Set<object>;
  listeners: Set<() => void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxy_so_bloom_modal_overlays__: ModalRegistry | undefined;
}

/**
 * `globalThis`-anchored for the same reason as `./stack.ts`: the surfaces that
 * register (`./dialog`, `./settings-modal`, …) and the boundary the app mounts
 * (`./portal`) are imported through different subpaths, and a bundler can
 * resolve those through different export conditions. Two physical copies of
 * this module would each keep their own set, and the boundary would never hear
 * about the surfaces.
 */
function registry(): ModalRegistry {
  globalThis.__oxy_so_bloom_modal_overlays__ ??= { live: new Set(), listeners: new Set() };
  return globalThis.__oxy_so_bloom_modal_overlays__;
}

function notify(reg: ModalRegistry): void {
  for (const listener of Array.from(reg.listeners)) listener();
}

/**
 * Mark a modal overlay as open. Returns its release. Called from an effect in
 * `OverlayRoot`, which React balances even under StrictMode.
 */
export function registerModalOverlay(token: object): () => void {
  const reg = registry();
  const wasActive = reg.live.size > 0;
  reg.live.add(token);
  if (!wasActive) notify(reg);
  return () => {
    const current = registry();
    if (!current.live.delete(token)) return;
    if (current.live.size === 0) notify(current);
  };
}

/** Whether any modal overlay is open. */
export function hasActiveModalOverlays(): boolean {
  return registry().live.size > 0;
}

/** How many modal overlays are open. Exported for tests. */
export function activeModalOverlayCount(): number {
  return registry().live.size;
}

/**
 * Subscribe to changes in `hasActiveModalOverlays()`. Listeners fire only when
 * the answer flips — a second modal opening over a first changes nothing for
 * the content underneath.
 */
export function subscribeModalOverlays(listener: () => void): () => void {
  const reg = registry();
  reg.listeners.add(listener);
  return () => {
    registry().listeners.delete(listener);
  };
}

/** Test seam — drops all open modals, notifying current subscribers. */
export function resetModalOverlays(): void {
  const reg = registry();
  const wasActive = reg.live.size > 0;
  reg.live.clear();
  if (wasActive) notify(reg);
}
