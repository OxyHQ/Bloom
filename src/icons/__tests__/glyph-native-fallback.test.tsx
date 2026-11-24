import TestRenderer, { act } from 'react-test-renderer';
import { BloomThemeProvider } from '../../theme';
import { RiHeart3Line } from '../remix/RiHeart3Line';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  UIManager: { hasViewManagerConfig: (name: string) => false && name === 'BloomIconV1' },
  requireNativeComponent: (name: string) => name,
}));
// The icon modules import `./glyph`; Metro picks `glyph.native.tsx` on native, Jest does not.
jest.mock('../glyph', () => jest.requireActual('../glyph.native'));

function hosts(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider fonts={false}>{element}</BloomThemeProvider>,
    );
  });
  // The icon's own host nodes: the native view, or react-native-svg's parts (the provider adds its own).
  return renderer.root.findAll(
    (node) => typeof node.type === 'string' && /^(BloomIconV1|Svg|G|Path|Defs)$/.test(node.type),
  );
}

describe('a Bloom icon on native, on a binary without the icon view', () => {
  it('stays react-native-svg', () => {
    const types = hosts(<RiHeart3Line size="sm" fill="#ff0000" />).map((node) => node.type);
    expect(types).toContain('Svg');
    expect(types).toContain('Path');
    expect(types).not.toContain('BloomIconV1');
  });
});
