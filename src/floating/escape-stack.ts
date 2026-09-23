/**
 * Escape for the anchored surfaces — WEB. One listener for every open
 * `FloatingPanel`, dismissing only the INNERMOST (most recently opened) one and
 * keeping the key from every enclosing surface.
 *
 * THE DEFECT IT REPLACES. Each panel added its own bubble-phase `keydown`
 * listener on `document` and called `stopPropagation()`. A `Dialog` listens on
 * `document` too, and `stopPropagation` does not stop a SIBLING listener on the
 * same node: listeners on one node run in registration order, and the dialog —
 * open first — registered first. So Escape on a `Select` inside a `Dialog`
 * closed the DIALOG, and the list with it. Two panels open at once (a select
 * inside a popover) had the same shape: the outer one registered first and
 * closed first.
 *
 * THE MECHANISM.
 *
 *  - The listener sits on `document.documentElement` in the BUBBLE phase. That
 *    is one node BELOW `document`, so it runs before any `document` listener —
 *    the Dialog's included — and its `stopPropagation()` keeps the key from
 *    ever reaching them. It is also ABOVE React's roots (the app root and every
 *    portal container sit inside `<body>`), so a control inside a panel still
 *    sees Escape first and can keep it — the composer's model-picker search
 *    clears its query on Escape and stops the key, exactly as it did when the
 *    panel listened on `document`.
 *  - Entries form a stack: the panel opened LAST is dismissed, whatever order
 *    the listeners happen to be in.
 *  - `hasOpenFloatingSurface()` lets the surface host's window-capture Escape
 *    router (`surfaces/SurfaceHost.tsx`) stand aside while a panel is open. It
 *    runs before anything here, so without the check it would dismiss the
 *    stacked dialog UNDER the open list.
 *
 * `globalThis`-anchored for the same reason as `overlay/stack.ts`: the families
 * that open panels are imported through different subpaths, and a bundler can
 * resolve two physical copies of this module.
 */

interface EscapeEntry {
  dismiss: () => void;
}

interface EscapeRegistry {
  stack: EscapeEntry[];
  listener: ((event: KeyboardEvent) => void) | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxy_so_bloom_floating_escape__: EscapeRegistry | undefined;
}

function registry(): EscapeRegistry {
  globalThis.__oxy_so_bloom_floating_escape__ ??= { stack: [], listener: null };
  return globalThis.__oxy_so_bloom_floating_escape__;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const stack = registry().stack;
  const top = stack[stack.length - 1];
  if (!top) return;
  event.stopPropagation();
  top.dismiss();
}

/**
 * Put an open surface on top of the Escape stack. Returns the release, which
 * removes exactly this entry wherever it now sits — a parent can close before
 * its submenu's effect cleanup runs.
 */
export function pushFloatingEscape(dismiss: () => void): () => void {
  const reg = registry();
  const entry: EscapeEntry = { dismiss };
  reg.stack.push(entry);
  if (!reg.listener && typeof document !== 'undefined') {
    reg.listener = onKeyDown;
    document.documentElement.addEventListener('keydown', onKeyDown);
  }
  return () => {
    const current = registry();
    const index = current.stack.indexOf(entry);
    if (index >= 0) current.stack.splice(index, 1);
    if (current.stack.length === 0 && current.listener && typeof document !== 'undefined') {
      document.documentElement.removeEventListener('keydown', current.listener);
      current.listener = null;
    }
  };
}

/** Whether an anchored surface is open and will take the next Escape. */
export function hasOpenFloatingSurface(): boolean {
  return registry().stack.length > 0;
}
