import TestRenderer, { act } from 'react-test-renderer';
import { BloomThemeProvider } from '../../theme';
import { RiHeart3Line } from '../remix/RiHeart3Line';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function svgSize(element: React.ReactElement): { width: unknown; height: unknown } {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<BloomThemeProvider fonts={false}>{element}</BloomThemeProvider>);
  });
  const svg = renderer.root.findAll((node) => typeof node.type === 'string' && node.props.width !== undefined)[0];
  return { width: svg?.props.width, height: svg?.props.height };
}

describe('an icon’s size', () => {
  it('is its rung, by name', () => {
    expect(svgSize(<RiHeart3Line size="sm" />)).toEqual({ width: 16, height: 16 });
  });
  // A number was looked up as a rung name and drew NaN.
  it('is the number itself, in points', () => {
    expect(svgSize(<RiHeart3Line size={16} />)).toEqual({ width: 16, height: 16 });
    expect(svgSize(<RiHeart3Line size={13} />)).toEqual({ width: 13, height: 13 });
  });
  it('is md with none', () => {
    expect(svgSize(<RiHeart3Line />)).toEqual({ width: 20, height: 20 });
  });
});
