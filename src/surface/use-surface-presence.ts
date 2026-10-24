import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { WebCssStyle } from '../styles/web-view-style';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { materialHostSelector } from './web-material';

/**
 * How present a surface that paints the material is, without making it, or
 * anything above it, a BACKDROP ROOT.
 *
 * In Chromium an element with `opacity` below 1, any `filter` (`blur(0px)`
 * included: only `none` is safe), a `mask`, a `clip-path`, a `mix-blend-mode`
 * or a `backdrop-filter` of its own is where every backdrop filter under it
 * stops seeing: the material inside blurs nothing, loses its edge light, and
 * gets both back the moment the trigger goes away. A host that fades or dims
 * itself flickers flat for the whole fade; one left on `filter: blur(0px)` is
 * flat for good. So a surface never fades its host or an ancestor of one:
 *
 * - the host moves and scales with `transform` only;
 * - the material's own layers fade through `--bloom-surface-presence` (an
 *   element's OWN opacity does not cut its own backdrop filter), over
 *   `--bloom-surface-presence-ms`. Both inherit, so a material host nested in
 *   the content fades with it;
 * - the content fades piece by piece: {@link useSurfacePresenceContent} gives
 *   each subtree that holds no material host its own opacity, and walks into
 *   the ones that do, so no material host ever has a fading ancestor.
 *
 * Dims (disabled, pressed, closed) are presences below 1 that stay. Native has
 * no backdrop filter, so there the host keeps its own opacity.
 */
export function surfacePresenceStyle(presence: number, duration = 0): WebCssStyle {
  if (Platform.OS !== 'web') return { opacity: clampPresence(presence) };
  return surfacePresenceVars(presence, duration);
}

/** The two variables the material's layers read; web only. */
export function surfacePresenceVars(presence: number, duration = 0): WebCssStyle {
  return {
    '--bloom-surface-presence': String(clampPresence(presence)),
    '--bloom-surface-presence-ms': `${Math.max(0, duration)}ms`,
  };
}

function clampPresence(presence: number): number {
  return Number.isFinite(presence) ? Math.min(1, Math.max(0, presence)) : 1;
}

export interface SurfacePresenceContentOptions {
  /** 0 is gone, 1 fully present; anything between is a dim that stays. */
  presence: number;
  /** How long a change of `presence` takes, in ms. 0 jumps. */
  duration?: number;
  /** CSS easing of the fade. */
  easing?: string;
  /** A blur, in px, the content starts from at presence 0 and loses on the way to 1. */
  blur?: number;
  /**
   * For a surface whose exit plays on a detached copy after it unmounts (a
   * Reanimated `exiting`): fade it out over this many ms as it leaves.
   */
  exit?: number;
}

interface Touched {
  opacity: string;
  transition: string;
  filter: string;
  boxShadow: string;
  base: number;
  setOpacity: string;
  setFilter: string;
  setShadow: string;
}

type HostNode = HTMLElement;

function resolveNode(target: unknown): HostNode | null {
  const node =
    target && typeof target === 'object' && 'current' in (target as object)
      ? (target as { current: unknown }).current
      : target;
  if (typeof HTMLElement === 'undefined' || !(node instanceof HTMLElement)) return null;
  return node;
}

/**
 * The pieces of `root` to fade so that no material host is under any of them:
 * the root itself when it holds no material host, otherwise every child subtree
 * that holds none, walking into the ones that do (and into a host's own
 * content, since its layers already fade through the presence variables).
 */
export function surfacePresenceTargets(
  root: Element,
  material = materialHostSelector(),
): Element[] {
  if (!material) return [root];
  const holds = (node: Element) => node.matches(material) || node.querySelector(material) !== null;
  if (!holds(root)) return [root];
  const out: Element[] = [];
  const visit = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (holds(child)) visit(child);
      else out.push(child);
    }
  };
  visit(root);
  return out;
}

/**
 * Make the browser compute the material layers at their current presence, so the
 * next change of `--bloom-surface-presence` transitions from it instead of from
 * whatever the layers last painted.
 */
function flushMaterialLayers(root: Element): void {
  const material = materialHostSelector();
  if (!material) return;
  const hosts = root.matches(material) ? [root] : [];
  hosts.push(...Array.from(root.querySelectorAll(material)));
  // A host's layers are computed with the host, so reading the host commits them.
  for (const host of hosts) void getComputedStyle(host).opacity;
}

/**
 * False on the frame a surface mounts and true from the frame after, then
 * `open`: a surface that mounts already open (a tooltip, a toast) needs one
 * painted frame at presence 0 for its fade-in to have somewhere to start.
 * `mounted` is for a component that outlives its surface (it starts over each
 * time the surface mounts again).
 */
export function useEnteredPresence(open: boolean, mounted = true): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setEntered(false);
      return;
    }
    if (typeof requestAnimationFrame === 'undefined') {
      setEntered(true);
      return;
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [mounted]);
  return entered && mounted && open;
}

/**
 * Fade or dim a material host's CONTENT (web), leaving the host and every
 * ancestor of a material host free of `opacity` and `filter`. Pass the host
 * itself (or the wrapper of its content) and the presence the host publishes
 * through {@link surfacePresenceStyle}; the two stay in step because both
 * follow the same number over the same duration.
 *
 * The first presence a surface mounts with lands without a transition (so a
 * surface that mounts at 0 and opens to 1 fades in, rather than out and back).
 * At 1 the content is handed back exactly as it was once the fade has run.
 * Inline styles this sets are restored only where React has not written the
 * property since, and content that mounts while dimmed is dimmed too.
 * No-op on native, where the host fades itself.
 */
export function useSurfacePresenceContent(
  target: unknown,
  {
    presence,
    duration = 0,
    easing = 'ease-out',
    blur = 0,
    exit = 0,
  }: SurfacePresenceContentOptions,
): void {
  const touched = useRef(new Map<HostNode, Touched>());
  const mounted = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRoot = useRef<HostNode | null>(null);
  const isWeb = Platform.OS === 'web';
  const value = clampPresence(presence);
  useIsomorphicLayoutEffect(() => {
    if (!isWeb) return;
    const root = resolveNode(target);
    if (!root) return;
    lastRoot.current = root;
    const animate = mounted.current && duration > 0;
    mounted.current = true;
    const map = touched.current;
    const motion = { duration, easing, blur };

    if (settle.current) clearTimeout(settle.current);
    settle.current = null;
    if (value >= 1 && map.size === 0) return;
    applyPresence(root, map, value, !animate, motion);
    if (value >= 1) {
      settle.current = setTimeout(() => restorePresence(map, blur), animate ? duration + 32 : 0);
      return;
    }
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => applyPresence(root, map, value, true, motion));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isWeb, target, value, duration, easing, blur]);

  const exitRef = useRef({ exit, easing, blur });
  exitRef.current = { exit, easing, blur };
  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
      const root = lastRoot.current;
      const leave = exitRef.current;
      if (!root || leave.exit <= 0 || typeof requestAnimationFrame === 'undefined') return;
      // The surface is unmounting while its exit plays on a detached copy (a
      // Reanimated `exiting` moves these very nodes into it). A frame later they
      // are in that copy and still in the document, so the fade transitions.
      requestAnimationFrame(() => {
        if (!root.isConnected) return;
        for (const [key, val] of Object.entries(surfacePresenceVars(0, leave.exit)))
          root.style.setProperty(key, String(val));
        applyPresence(root, new Map(), 0, false, {
          duration: leave.exit,
          easing: leave.easing,
          blur: leave.blur,
        });
      });
    },
    [],
  );
}

function applyPresence(
  root: HostNode,
  map: Map<HostNode, Touched>,
  value: number,
  instant: boolean,
  { duration, easing, blur }: { duration: number; easing: string; blur: number },
): void {
  const timing = `${duration}ms ${easing}`;
  const touch = (node: HostNode): Touched => {
    let entry = map.get(node);
    if (!entry) {
      const base = Number.parseFloat(getComputedStyle(node).opacity);
      entry = {
        opacity: node.style.opacity,
        transition: node.style.transition,
        filter: node.style.filter,
        boxShadow: node.style.boxShadow,
        base: Number.isFinite(base) ? base : 1,
        setOpacity: '',
        setFilter: '',
        setShadow: '',
      };
      map.set(node, entry);
    }
    return entry;
  };
  for (const node of surfacePresenceTargets(root)) {
    if (!(node instanceof HTMLElement)) continue;
    if (value >= 1 && instant && !map.has(node)) continue;
    const entry = touch(node);
    node.style.transition = instant
      ? 'none'
      : [`opacity ${timing}`, blur > 0 ? `filter ${timing}` : null].filter(Boolean).join(', ');
    entry.setOpacity = String(entry.base * value);
    node.style.opacity = entry.setOpacity;
    if (blur > 0) {
      entry.setFilter = value >= 1 ? 'none' : `blur(${blur * (1 - value)}px)`;
      node.style.filter = entry.setFilter;
    }
    // Committed now, so a presence that changes before the next frame (a
    // surface placed in the same pass it mounted in) still transitions from here.
    if (instant) void getComputedStyle(node).opacity;
  }
  // A nested material host's layers already follow the inherited presence; its
  // shadow cannot, so a host that is gone drops it too (a shadow and `none`
  // interpolate). Dims keep their shadows.
  const material = materialHostSelector();
  if (material) {
    for (const host of Array.from(root.querySelectorAll(material))) {
      if (!(host instanceof HTMLElement)) continue;
      if (value > 0 && !map.has(host)) continue;
      const entry = touch(host);
      host.style.transition = instant ? 'none' : `box-shadow ${timing}`;
      entry.setShadow = value > 0 ? entry.boxShadow : 'none';
      host.style.boxShadow = entry.setShadow;
    }
  }
  if (instant) flushMaterialLayers(root);
}

function restorePresence(map: Map<HostNode, Touched>, blur: number): void {
  for (const [node, entry] of map) {
    if (entry.setOpacity && node.style.opacity === entry.setOpacity)
      node.style.opacity = entry.opacity;
    if (blur > 0 && entry.setFilter && node.style.filter === entry.setFilter)
      node.style.filter = entry.filter;
    if (entry.setShadow && node.style.boxShadow === entry.setShadow)
      node.style.boxShadow = entry.boxShadow;
    node.style.transition = entry.transition;
  }
  map.clear();
}

const REVEALED_HOST = '.bloom-btn--surface';

const withHost = (selectors: string, suffix: string) =>
  selectors
    .split(',')
    .map((selector) => `${selector.trim()} ${suffix}`)
    .join(',\n');

/**
 * CSS for material controls revealed on hover or focus (a card's photo arrows, a
 * tile's controls). The revealing box never fades: it publishes a presence of 0
 * (or 1 where `shown` matches), the controls' layers follow it, and their
 * content and shadow fade on their own. A revealing box at `opacity: 0` would be
 * a backdrop root: every reveal would fade in flat and pop its blur in at the end.
 *
 * `scope` matches the revealing box at rest, `shown` where it is revealed, and
 * `rehide` (optional) where it hides again regardless (a drag in progress).
 * Emit it inside the same `@media` the reveal belongs to.
 */
export function surfaceRevealCss({
  scope,
  shown,
  rehide,
  duration = 150,
  easing = 'ease-out',
}: {
  scope: string;
  shown: string;
  rehide?: string;
  duration?: number;
  easing?: string;
}): string {
  const hide = (selectors: string) => `${selectors} {
  --bloom-surface-presence: 0;
}
${withHost(selectors, REVEALED_HOST)} {
  box-shadow: none;
}`;
  return `${scope} {
  --bloom-surface-presence-ms: ${duration}ms;
}
${withHost(scope, `${REVEALED_HOST} > *`)} {
  opacity: var(--bloom-surface-presence, 1);
  transition: opacity ${duration}ms ${easing};
}
${hide(scope)}
${shown} {
  --bloom-surface-presence: 1;
}
${withHost(shown, REVEALED_HOST)} {
  box-shadow: var(--bloom-btn-shadow, none);
}
${rehide ? hide(rehide) : ''}`;
}
