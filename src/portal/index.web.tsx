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
 * Render children into a stable container at the end of `document.body`.
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
    // Sits above the document flow; individual portaled components can use
    // their own z-index for stacking among themselves.
    root.style.position = 'relative';
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
