/**
 * The fill a rendered control paints. A control on the shared surface material
 * keeps its host transparent and hands its fill to `SurfacePaint`, so a suite
 * asserting "the pill is this colour" reads the material's semantic fill when
 * the host paints none of its own.
 */
import type { ReactTestInstance } from 'react-test-renderer';
import { SurfacePaint } from '../../surface/SurfacePaint';
import { isHostNode, resolvedStyle, type HostNode } from './rendered-style';

const CLEAR = new Set([undefined, '', 'transparent', 'rgba(0, 0, 0, 0)']);

/** The first `SurfacePaint` under a rendered node. */
export function surfacePaintOf(node: ReactTestInstance): ReactTestInstance | undefined {
  // A `memo` component's instance carries the wrapped function as its type.
  const inner = (SurfacePaint as unknown as { type: unknown }).type;
  return node.findAll((n) => n.type === SurfacePaint || n.type === inner)[0];
}

/**
 * Native renderer: the host's own background, else its material's fill. Takes a
 * test instance, or a host node from `toJSON()`, where the material is the
 * inert full-bleed layer among the host's children.
 */
export function paintedFill(node: ReactTestInstance | HostNode): unknown {
  const own = resolvedStyle(node.props.style).backgroundColor as string | undefined;
  if (!CLEAR.has(own)) return own;
  if ('findAll' in node) return surfacePaintOf(node)?.props.fill ?? own;
  const layer = (node.children ?? []).filter(isHostNode).find((child) => {
    const style = resolvedStyle(child.props.style);
    return style.position === 'absolute' && style.pointerEvents === 'none';
  });
  return layer ? resolvedStyle(layer.props.style).backgroundColor : own;
}

/**
 * DOM: the element's own background, else the fill its material carries, in
 * the same serialisation `getComputedStyle` gives a background.
 */
export function materialFill(el: Element): string {
  const own = getComputedStyle(el).backgroundColor;
  if (!CLEAR.has(own)) return own;
  const fill = el.querySelector<HTMLElement>('[data-bloom-surface-fill]')?.dataset.bloomSurfaceFill;
  if (fill === undefined) return own;
  const probe = document.createElement('div');
  probe.style.backgroundColor = fill;
  return probe.style.backgroundColor;
}

/**
 * The host views that carry a surface material filled with `fill`: the nearest
 * host above each matching `SurfacePaint` (a sliding capsule, say), whose own
 * style holds the geometry and motion.
 */
export function hostsPaintedWith(root: ReactTestInstance, fill: string): ReactTestInstance[] {
  const inner = (SurfacePaint as unknown as { type: unknown }).type;
  return root
    .findAll((n) => (n.type === SurfacePaint || n.type === inner) && n.props.fill === fill)
    .map((paint) => {
      let node = paint.parent;
      while (node && typeof node.type !== 'string') node = node.parent;
      return node;
    })
    .filter((node): node is ReactTestInstance => node !== null);
}
