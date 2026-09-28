import { resolveSurfaceMaterial } from '../../surface/resolve-surface-material';
import { resolveChartCardPalette } from '../../chart-cards/palette';
import type { ReactTestInstance } from 'react-test-renderer';
import { SurfacePaint } from '../../surface/SurfacePaint';
import { resolvedStyle } from './rendered-style';

/** Card may opt into a content clip; inspect its layout without replacing host geometry. */
export function cardLayout(root: ReactTestInstance) {
  const id = root.props.testID;
  const content = root.findAll(node => node.props.testID === `${id}-clip`)[0];
  return { ...(content ? resolvedStyle(content.props.style) : {}), ...resolvedStyle(root.props.style) };
}

/** The material's fill contract, independent of its transparent host. Not a pixel test. */
export function cardFill(root: ReactTestInstance) {
  const component = (SurfacePaint as unknown as { type: unknown }).type;
  // The host's own paint precedes any nested cards or buttons.
  return root.findAll(node => node.type === component)[0]!.props.fill;
}

/** Chart content derives colours from the composited card, not its unpainted token. */
export function materialChartPalette(theme: import('../../theme/types').Theme) {
  const fill = resolveSurfaceMaterial({ fill: theme.colors.card, parentFill: theme.colors.background }).publishedFill;
  return resolveChartCardPalette(theme, fill);
}
