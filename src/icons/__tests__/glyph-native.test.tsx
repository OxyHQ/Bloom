import TestRenderer, { act } from 'react-test-renderer';
import { BloomThemeProvider } from '../../theme';
import { RiHeart3Line } from '../remix/RiHeart3Line';
import { LikeIcon } from '../social/LikeIcon';
import { createMultiPathSVG } from '../TEMPLATE';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  UIManager: { hasViewManagerConfig: (name: string) => true && name === 'BloomIconV1' },
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

function flat(style: unknown): Record<string, unknown> {
  return Array.isArray(style)
    ? Object.assign({}, ...style.map(flat))
    : ((style ?? {}) as Record<string, unknown>);
}

describe('a Bloom icon on native, with the icon view in the binary', () => {
  it('is one host view carrying the glyph, its paint and its side', () => {
    const [view, ...others] = hosts(<RiHeart3Line size="sm" fill="#ff0000" testID="heart" />);
    expect(others).toHaveLength(0);
    expect(view?.type).toBe('BloomIconV1');
    expect(view?.props).toMatchObject({
      viewBox: '0 0 24 24',
      fill: '#ff0000',
      strokeWidth: 0,
      gradient: null,
      testID: 'heart',
    });
    expect(view?.props.paths).toHaveLength(1);
    expect(flat(view?.props.style)).toEqual({ width: 16, height: 16, flex: 0 });
  });

  it('strokes a stroked glyph in its fill, on its own viewBox', () => {
    const [view] = hosts(<LikeIcon fill="#00ff00" />);
    expect(view?.props).toMatchObject({ viewBox: '0 0 18 18', strokeWidth: 1.8, fill: '#00ff00' });
  });

  it('keeps every path of a multi-path glyph, filled', () => {
    const TwoBars = createMultiPathSVG({ paths: ['M3 5H21V7H3Z', 'M3 17H21V19H3Z'] });
    const [view] = hosts(<TwoBars fill="#000000" />);
    expect(view?.props.paths.length).toBeGreaterThan(1);
    expect(view?.props.strokeWidth).toBe(0);
  });

  it('paints a gradient token instead of the fill, as react-native-svg stops', () => {
    const [view] = hosts(<RiHeart3Line gradient="sky" fill="#ff0000" />);
    expect(view?.props.fill).toBeNull();
    expect(view?.props.gradient).toEqual([0, 0xff0a7aff | 0, 1, 0xff59b9ff | 0]);
  });

  it('resolves currentColor from style.color, black without it, and draws nothing for none', () => {
    expect(
      hosts(<RiHeart3Line fill="currentColor" style={{ color: '#123456' }} />)[0]?.props.fill,
    ).toBe('#123456');
    expect(hosts(<RiHeart3Line fill="currentColor" />)[0]?.props.fill).toBe('black');
    expect(hosts(<RiHeart3Line fill="none" />)[0]?.props.fill).toBeNull();
  });

  it('takes style.color as the fill with no fill, and keeps the caller layout and opacity', () => {
    const [view] = hosts(
      <RiHeart3Line
        width={13}
        height={13}
        opacity={0.5}
        style={{ color: '#abcdef', marginLeft: 4 }}
      />,
    );
    expect(view?.props.fill).toBe('#abcdef');
    expect(view?.props.width).toBeUndefined();
    expect(flat(view?.props.style)).toEqual({
      color: '#abcdef',
      marginLeft: 4,
      width: 13,
      height: 13,
      flex: 0,
      opacity: 0.5,
    });
  });
});
