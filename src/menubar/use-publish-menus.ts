/**
 * With the `menu-bar` capability, a `Menubar` gives the platform its menus
 * and runs the item the person chooses there (OxyOS ADR 0021, decision 2).
 *
 * ONE BAR PER WINDOW. The platform shows one set of menus for the window, so
 * one `Menubar` publishes: the first mounted of those still mounted. Another
 * one mounted while it is (a second bar, a bar inside a page that already has
 * one) publishes nothing, runs no shortcut and warns in development; when the
 * first unmounts, the next in mount order takes over and publishes its own.
 *
 * Publishing:
 *  - once when the bar takes over, after its declaration has registered;
 *  - after each commit that changed the description, ONE call however many
 *    items changed in it, and none when the description came out the same;
 *  - `setMenus([])` when it stops (unmounted, or the platform's bar went away).
 */
import { useState } from 'react';

import type { PlatformMenuBar } from '../platform-surface/types';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import type { MenubarRegistry } from './registry';

interface Claimant {
  start(): void;
  stop(): void;
}

declare global {
  var __oxy_so_bloom_menubar_claims__: WeakMap<PlatformMenuBar, Claimant[]> | undefined;
}

/**
 * The bars claiming each platform bar, in mount order; the first publishes.
 * `globalThis`-anchored as `floating/escape-stack.ts` is: a bundler can resolve
 * two physical copies of this module, and both must see one window.
 */
function claims(): WeakMap<PlatformMenuBar, Claimant[]> {
  globalThis.__oxy_so_bloom_menubar_claims__ ??= new WeakMap();
  return globalThis.__oxy_so_bloom_menubar_claims__;
}

function claim(menuBar: PlatformMenuBar, claimant: Claimant): () => void {
  const all = claims();
  const queue = all.get(menuBar) ?? [];
  all.set(menuBar, queue);
  queue.push(claimant);
  if (queue.length === 1) {
    claimant.start();
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Bloom] Menubar: another Menubar is already giving this window its menus. The platform ' +
        'shows one menu bar per window, so only the first mounted Menubar publishes its menus ' +
        'and runs their shortcuts; this one does neither until that one unmounts. Declare the ' +
        "window's menus in one Menubar.",
    );
  }
  return () => {
    const index = queue.indexOf(claimant);
    if (index < 0) return;
    queue.splice(index, 1);
    if (index > 0) return;
    claimant.stop();
    queue[0]?.start();
  };
}

/**
 * Publishes `registry`'s description to `menuBar` while this bar is the
 * window's (see the file comment). Returns whether it is: only then are its
 * shortcuts live. With no platform bar it does nothing and returns false.
 */
export function usePublishMenus(
  registry: MenubarRegistry,
  menuBar: PlatformMenuBar | null,
): boolean {
  const [publishing, setPublishing] = useState(false);

  // A layout effect: it runs after the declaration's own registration effects
  // in the same commit (children's run first), so the first description is
  // whole, and the platform has it before the first frame.
  useIsomorphicLayoutEffect(() => {
    if (!menuBar) return undefined;
    let published: string | null = null;
    let stopListening: (() => void) | null = null;

    const publish = () => {
      const menus = registry.describe();
      const text = JSON.stringify(menus);
      if (text === published) return;
      published = text;
      menuBar.setMenus(menus);
    };

    return claim(menuBar, {
      start() {
        const offChanges = registry.subscribe(publish);
        const offActivate = menuBar.onActivate((id) => {
          registry.activate(id);
        });
        stopListening = () => {
          offChanges();
          offActivate();
        };
        setPublishing(true);
        publish();
      },
      stop() {
        stopListening?.();
        stopListening = null;
        setPublishing(false);
        if (published !== null && published !== '[]') menuBar.setMenus([]);
        published = null;
      },
    });
  }, [registry, menuBar]);

  return menuBar !== null && publishing;
}
