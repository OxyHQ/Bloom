/**
 * The fill a rendered control paints. A control on the shared surface material
 * keeps its host transparent and hands its fill to `SurfacePaint`, so a suite
 * asserting "the pill is this colour" reads the material's semantic fill when
 * the host paints none of its own.
 */
import type { ReactTestInstance } from 'react-test-renderer';
import { SurfacePaint } from '../../surface/SurfacePaint';
import { resolvedStyle } from './rendered-style';

const CLEAR = new Set([undefined, '', 'transparent', 'rgba(0, 0, 0, 0)']);

/** The first `SurfacePaint` under a rendered node. */
export function surfacePaintOf(node: ReactTestInstance): ReactTestInstance | undefined {
  return node.findAll((n) => n.type === SurfacePaint)[0];
}

/** Native renderer: the host's own background, else its material's fill. */
export function paintedFill(node: ReactTestInstance): unknown {
  const own = resolvedStyle(node.props.style).backgroundColor as string | undefined;
  if (!CLEAR.has(own)) return own;
  return surfacePaintOf(node)?.props.fill ?? own;
}

/** DOM: the element's own background, else the fill its material carries. */
export function materialFill(el: Element): string {
  const own = getComputedStyle(el).backgroundColor;
  if (!CLEAR.has(own)) return own;
  const paint = el.querySelector<HTMLElement>('[data-bloom-surface-fill]');
  return paint?.dataset.bloomSurfaceFill ?? own;
}
