import type { RefObject } from 'react';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { Platform } from 'react-native';
import { parseRgba } from '../theme/color-utils';
import {
  BAKED_BODY_VAR,
  BAKED_MATERIAL_ATTRIBUTE,
  BAKE_OFF_ATTRIBUTE,
  INCREASED_CONTRAST_ATTRIBUTE,
  PAINT_LAYER_ATTRIBUTE,
  REDUCED_TRANSPARENCY_ATTRIBUTE,
  materialHostSelector,
} from './web-material';

/**
 * The web material, baked where its backdrop is known.
 *
 * A material host's body is its tint over its backdrop filtered: blurred,
 * saturated, flattened and brightened (`optics.ts`). When everything behind the
 * host is one flat colour, blurring it changes nothing and the rest of the
 * filter is arithmetic on that colour. So the backdrop the filter would produce
 * is computed here once, in JavaScript, with the tint over it, and the host
 * paints that body as a plain colour (`data-bloom-material="baked"`,
 * `--bloom-surface-baked-body`):
 * the same pixels, with no backdrop filter for the compositor to run every frame.
 * The inset lighting is a separate self-painted layer, identical on live and
 * baked bodies; it never reads or filters the backdrop.
 *
 * "Known" is decided from the document, per instance, after the host mounts:
 * the same Card is in the flow of a page in one place and over a photo in
 * another, which no static list of callers can tell apart. Walking up from the
 * host, the first thing that paints is the backing:
 *
 * - an element with an opaque, flat background (no image): bake on that colour;
 * - a material host baked earlier with an explicit lighting opt-out: bake on its body;
 * - anything else (a translucent or image background, a live material host, an
 *   illuminated material host, an element floating out of the flow, a backdrop
 *   root): stay live.
 *
 * The cache records one body colour, not the parent's spatial rim and bevel.
 * Even a child in its apparent centre can sample that lighting through blur,
 * and layout changes can move it closer. No geometric snapshot is used: a
 * child directly on a lit material stays live. An opaque flat owner between
 * the two can provide a known backing again.
 *
 * The host itself, and every element on the way up, must be in the flow (not
 * `absolute`, `fixed` or `sticky`), and no positioned or transformed earlier
 * sibling on the way may overlap it: either could put something else behind it.
 * A host starts live and is baked after it has painted once, so a wrong guess
 * can only ever cost performance, never show the wrong colour first.
 *
 * Hosts are processed in document order, parents before children, so an unlit
 * baked panel can supply its body's colour. The pass reruns for a host whose
 * props changed and for every host when the document's theme changes.
 */

type RGB = readonly [number, number, number];

const hosts = new Set<HTMLElement>();
const dirty = new Set<HTMLElement>();
/** Each baked host's body, for the hosts baked on it. */
const bodies = new WeakMap<Element, RGB>();
let frame: number | null = null;
let observer: MutationObserver | null = null;

const isDom = () =>
  Platform.OS === 'web' && typeof document !== 'undefined' && typeof window !== 'undefined';

function schedule() {
  if (frame !== null || !isDom()) return;
  frame = window.requestAnimationFrame(() => {
    frame = null;
    flush();
  });
}

function observeTheme() {
  if (observer || typeof MutationObserver === 'undefined') return;
  // The theme lives on the root: the dark class, the token variables, the
  // transparency and contrast attributes. Any change can move every backing.
  observer = new MutationObserver(() => {
    for (const host of hosts) dirty.add(host);
    schedule();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      'class',
      'style',
      BAKE_OFF_ATTRIBUTE,
      REDUCED_TRANSPARENCY_ATTRIBUTE,
      INCREASED_CONTRAST_ATTRIBUTE,
    ],
  });
}

/** Register a material host; returns the unregister. Web only, no-op elsewhere. */
export function registerBakedMaterial(host: HTMLElement): () => void {
  if (!isDom()) return () => {};
  hosts.add(host);
  dirty.add(host);
  observeTheme();
  schedule();
  return () => {
    hosts.delete(host);
    dirty.delete(host);
    unbake(host);
    if (hosts.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

/**
 * Bake the material host `ref` holds when its backdrop is known. `deps` are what
 * changes its tint or its look (fill, theme): a change rebakes it.
 */
export function useBakedMaterial(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: readonly unknown[],
) {
  // A layout effect: a change of tint unbakes the host before that commit paints
  // (live, the same pixels), and the next frame bakes it again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are the caller's paint inputs.
  useIsomorphicLayoutEffect(() => {
    const host = ref.current;
    if (!enabled || !host) return;
    return registerBakedMaterial(host);
  }, [ref, enabled, ...deps]);
}

function unbake(host: HTMLElement) {
  if (!host.hasAttribute(BAKED_MATERIAL_ATTRIBUTE)) return;
  host.removeAttribute(BAKED_MATERIAL_ATTRIBUTE);
  host.style.removeProperty(BAKED_BODY_VAR);
  bodies.delete(host);
}

/** Run a pass now. Exported for the browser gate and tests; hosts call `schedule`. */
export function flush() {
  if (!isDom()) return;
  const root = document.documentElement;
  // With transparency reduced every body is already opaque and filters nothing:
  // there is nothing to bake.
  const off =
    root.getAttribute(BAKE_OFF_ATTRIBUTE) === 'off' ||
    root.hasAttribute(REDUCED_TRANSPARENCY_ATTRIBUTE) ||
    root.hasAttribute(INCREASED_CONTRAST_ATTRIBUTE);
  // A dirty host's descendants are baked on its body: they rerun with it.
  const pending = [...hosts].filter(
    (host) => dirty.has(host) || [...dirty].some((d) => d !== host && d.contains(host)),
  );
  dirty.clear();
  pending.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  // Read every live tint first: a baked host's ::before no longer shows it.
  for (const host of pending) unbake(host);
  if (off) return;
  const outOfFlow = new WeakMap<Element, Element[]>();
  for (const host of pending) {
    if (!host.isConnected) continue;
    const backing = backingOf(host, outOfFlow);
    const look = parseLook(getComputedStyle(host).getPropertyValue('--bloom-surface-filter'));
    const tint = parseRgba(getComputedStyle(host, '::before').backgroundColor);
    if (!backing || !look || !tint) continue;
    const body = over(
      [tint.r / 255, tint.g / 255, tint.b / 255],
      tint.a,
      filterColor(backing, look),
    );
    host.style.setProperty(BAKED_BODY_VAR, css(body));
    host.setAttribute(BAKED_MATERIAL_ATTRIBUTE, 'baked');
    bodies.set(host, body);
  }
}

const css = ([r, g, b]: RGB) =>
  `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

const over = (front: RGB, alpha: number, back: RGB): RGB => [
  front[0] * alpha + back[0] * (1 - alpha),
  front[1] * alpha + back[1] * (1 - alpha),
  front[2] * alpha + back[2] * (1 - alpha),
];

const FLOATING = new Set(['absolute', 'fixed', 'sticky']);
/** An unset computed value reads as its initial one. */
const isNone = (value: string | undefined) => !value || value === 'none';

/** The cache represents only the body; a lit material is not a flat backing. */
function flatMaterialBody(host: Element): RGB | null {
  // Responsive chrome can turn a computed `none` into lighting on resize,
  // without changing paint inputs. Only a literal inline opt-out is stable;
  // it must still win in the cascade. An absent value uses the lit fallback.
  if (
    !(host instanceof HTMLElement) ||
    host.style.getPropertyValue('--bloom-surface-lighting').trim() !== 'none' ||
    getComputedStyle(host).getPropertyValue('--bloom-surface-lighting').trim() !== 'none'
  )
    return null;
  return bodies.get(host) ?? null;
}

/** The flat colour behind `host`, or null when it is not known. */
export function backingOf(host: HTMLElement, outOfFlow: WeakMap<Element, Element[]>): RGB | null {
  // SurfacePaint's layer covers its host exactly: the host is what sits in the page.
  const subject = host.hasAttribute(PAINT_LAYER_ATTRIBUTE) ? host.parentElement : host;
  if (!subject) return null;
  if (FLOATING.has(getComputedStyle(subject).position)) return null;
  const rect = subject.getBoundingClientRect();
  const selector = materialHostSelector();
  let child: Element = subject;
  for (let node = subject.parentElement; node; child = node, node = node.parentElement) {
    // A host whose material is its own ::before, or a SurfacePaint layer under
    // its content: either way that material is what is behind.
    if (selector && node.matches(selector)) return flatMaterialBody(node);
    const layer = paintLayerOf(node, child);
    if (layer) return flatMaterialBody(layer);
    if (overlapped(node, child, rect, outOfFlow)) return null;
    const style = getComputedStyle(node);
    if (!isNone(style.backgroundImage)) return null;
    const fill = parseRgba(style.backgroundColor);
    if (fill && fill.a === 1) return [fill.r / 255, fill.g / 255, fill.b / 255];
    if (fill && fill.a > 0) return null;
    if (FLOATING.has(style.position)) return null;
    if (
      !isNone(style.filter) ||
      (style.opacity !== '' && style.opacity !== '1') ||
      !isNone(style.backdropFilter) ||
      (style.mixBlendMode !== '' && style.mixBlendMode !== 'normal')
    )
      return null;
  }
  return null;
}

/** A SurfacePaint layer painted under `child` inside `node`, if there is one. */
function paintLayerOf(node: Element, child: Element): Element | null {
  for (const el of Array.from(node.children)) {
    if (el === child) return null;
    if (el.hasAttribute(PAINT_LAYER_ATTRIBUTE)) return el;
  }
  return null;
}

/**
 * Whether an earlier sibling of `child` inside `node` that is out of the flow
 * (positioned or transformed) overlaps `rect`: it would paint behind the host.
 */
function overlapped(
  node: Element,
  child: Element,
  rect: DOMRect,
  outOfFlow: WeakMap<Element, Element[]>,
): boolean {
  let floating = outOfFlow.get(node);
  if (!floating) {
    floating = Array.from(node.children).filter((el) => {
      const style = getComputedStyle(el);
      return FLOATING.has(style.position) || !isNone(style.transform);
    });
    outOfFlow.set(node, floating);
  }
  for (const el of floating) {
    if (el === child) continue;
    // Only what paints before the host can be behind it.
    if (!(el.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
    const other = el.getBoundingClientRect();
    if (
      other.right > rect.left &&
      other.left < rect.right &&
      other.bottom > rect.top &&
      other.top < rect.bottom
    )
      return true;
  }
  return false;
}

export type Look = readonly (readonly [name: string, amount: number])[];

/** The colour functions of a material filter, in order; blur is dropped (flat in, flat out). */
export function parseLook(filter: string): Look | null {
  const steps: [string, number][] = [];
  for (const match of filter.matchAll(/([a-z-]+)\(([^)]*)\)/g)) {
    const name = match[1] ?? '';
    if (name === 'blur') continue;
    const amount = Number.parseFloat(match[2] ?? '');
    if (!['saturate', 'contrast', 'brightness'].includes(name) || !Number.isFinite(amount))
      return null;
    steps.push([name, amount]);
  }
  return steps.length ? steps : null;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A flat colour through the material's filter, as the CSS Filter Effects
 * functions define them (sRGB, each step clamped).
 */
export function filterColor(color: RGB, look: Look): RGB {
  let [r, g, b] = color;
  for (const [name, s] of look) {
    if (name === 'saturate') {
      [r, g, b] = [
        clamp((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
        clamp((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
        clamp((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
      ];
    } else if (name === 'contrast') {
      const k = (v: number) => clamp((v - 0.5) * s + 0.5);
      [r, g, b] = [k(r), k(g), k(b)];
    } else {
      [r, g, b] = [clamp(r * s), clamp(g * s), clamp(b * s)];
    }
  }
  return [r, g, b];
}
