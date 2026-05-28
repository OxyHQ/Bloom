/**
 * Web variant of the Portal API.
 *
 * On native we keep the context-based portal group (the consumer mounts a
 * `<Provider />` near the root and an `<Outlet />` to render portaled
 * components inside the native view hierarchy). On web there's a stable
 * `document.body`, so we portal directly there via `react-dom`'s native
 * `createPortal` — no provider, no outlet, no setup. This matches how
 * mature web component libraries (Radix, Mantine, Tamagui) ship their
 * portals.
 *
 * The native and web APIs are kept identical: `Provider` and `Outlet` are
 * still exported on web — they just become harmless no-op fragments so
 * consumers that *do* mount them keep compiling.
 */
import React, { Fragment, memo, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Render children into a stable container appended to `document.body`.
 *
 * The container is positioned `fixed` and stretched edge-to-edge so it
 * fills the viewport. This makes it a valid containing block for any
 * portaled descendant that uses `position: absolute` (e.g. RN's
 * `StyleSheet.absoluteFillObject`) — without it those children anchor to a
 * zero-area block at the end of `<body>` and render off-screen.
 *
 * `pointer-events: none` lets clicks fall through to the underlying app
 * while the portal is idle. Interactive descendants (backdrops, modal
 * panels, dropdowns, etc.) must opt back in with `pointer-events: auto`
 * (or RN's `pointerEvents="auto"` / `"box-only"`). Bloom's own overlay
 * components do this on the elements they actually want to receive
 * events.
 *
 * Lazy-creates the container on first mount so SSR (where `document` does
 * not exist) doesn't crash — the portal simply renders nothing on the
 * server and snaps in on hydration.
 */
function getPortalRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let root = document.getElementById('bloom-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'bloom-portal-root';
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.left = '0';
    root.style.right = '0';
    root.style.bottom = '0';
    // Idle portal must not intercept clicks on the underlying app.
    // Children opt back in to receive events via their own pointer-events.
    root.style.pointerEvents = 'none';
    // Above the document flow; individual portaled components can use
    // their own z-index for stacking among themselves.
    root.style.zIndex = '999999';
    document.body.appendChild(root);
  }
  return root;
}

export function Portal({ children }: React.PropsWithChildren<object>) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setRoot(getPortalRoot());
  }, []);
  if (!root) return null;
  return createPortal(children, root);
}

// Native API parity — on web these are inert. Provider mounts its children
// inline; Outlet renders nothing. Consumers that mount them on web keep
// compiling without behaviour change.
export function Provider(props: React.PropsWithChildren<object>) {
  return <Fragment>{props.children}</Fragment>;
}

export const Outlet = memo(function Outlet() {
  return null;
});
