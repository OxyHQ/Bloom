import type { ReactTestInstance } from 'react-test-renderer';
import { SurfacePaint } from '../../surface/SurfacePaint';
import { resolvedStyle } from './rendered-style';

/** Card splits native content layout from its shadow host. Inspect both real nodes. */
export function cardLayout(root: ReactTestInstance) {
  const id = root.props.testID;
  const content = root.findAll(node => node.props.testID === `${id}-content`)[0];
  return { ...resolvedStyle(root.props.style), ...(content ? resolvedStyle(content.props.style) : {}) };
}

/** The material's fill contract, independent of its transparent host. Not a pixel test. */
export function cardFill(root: ReactTestInstance) {
  const component = (SurfacePaint as unknown as { type: unknown }).type;
  // The host's own paint precedes any nested cards or buttons.
  return root.findAll(node => node.type === component)[0]!.props.fill;
}
