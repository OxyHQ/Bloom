import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { tokens } from '@oxy.so/bloom/styles';
import { SHADOW_BOX } from './support/bloom-design-tokens';
import { LIGHT, PaintContext } from './support/bloom-theme';
import { Fill, HStack, Shape, Text, VStack, ZStack } from '../primitives';
import { toElement } from '../render';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

function mount(element: ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(PaintContext.Provider, { value: LIGHT }, element));
  });
  return renderer;
}

const VIEW: string = 'View';
function views(renderer: ReactTestRenderer): ReactTestInstance[] {
  return renderer.root.findAll((instance) => instance.type === VIEW);
}

describe('a stack’s distribution', () => {
  it('justify spreads the children along the axis; wrap flows them onto further lines', () => {
    const [row] = views(mount(toElement(HStack(Text('a')).justify('center').wrap())));
    expect(row?.props.style).toEqual({
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
    });
    const [spread] = views(mount(toElement(VStack(Text('a')).justify('between').spacing('sm'))));
    expect(spread?.props.style).toEqual({
      justifyContent: 'space-between',
      gap: tokens.space.sm,
    });
  });

  it('an axis lays a stack out over its constructor’s', () => {
    const [stack] = views(mount(toElement(HStack(Text('a')).axis('vertical'))));
    expect(stack?.props.style).toEqual({ flexDirection: 'column' });
  });
});

describe('a view’s place in its parent', () => {
  it('alignSelf, zIndex and hidden go on the outermost box', () => {
    const [outer, inner] = views(
      mount(
        toElement(
          VStack(Text('a'))
            .background('surface')
            .padding('md')
            .alignSelf('center')
            .zIndex('floating')
            .hidden(),
        ),
      ),
    );
    expect(outer?.props.style).toEqual({
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 12,
      paddingEnd: 12,
      alignSelf: 'center',
      zIndex: 10,
      display: 'none',
    });
    expect(inner?.props.style).toEqual({ backgroundColor: LIGHT.backgroundSecondary });
  });

  it('a position pins the view to its parent’s edges; an offset shifts it where it is drawn', () => {
    const [pinned] = views(
      mount(toElement(VStack(Text('a')).position({ top: 'none', trailing: '-xs' }))),
    );
    expect(pinned?.props.style).toEqual({ position: 'absolute', top: 0, end: -tokens.space.xs });
    const [shifted] = views(mount(toElement(VStack(Text('a')).offset({ y: '2xs' }))));
    expect(shifted?.props.style).toEqual({ transform: [{ translateY: 2 }] });
  });

  it('a frame takes lengths relative to the parent', () => {
    const [box] = views(
      mount(toElement(VStack(Text('a')).frame({ width: 'full', maxWidth: '1/2' }))),
    );
    expect(box?.props.style).toEqual({ width: '100%', maxWidth: '50%' });
  });
});

describe('overlays', () => {
  it('an overlay is a box over the view, its content at the alignment; a view background is one under it', () => {
    const r = mount(
      toElement(
        VStack(Text('body'))
          .padding('md')
          .overlay(Text('badge'), 'top-trailing')
          .background(Text('art'), 'bottom'),
      ),
    );
    const [wrapper, art, body, badge] = views(r);
    expect(wrapper?.props.style).toEqual({
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 12,
      paddingEnd: 12,
    });
    const box = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };
    expect(art?.props).toMatchObject({
      pointerEvents: 'box-none',
      style: { ...box, justifyContent: 'flex-end', alignItems: 'center' },
    });
    expect(badge?.props.style).toEqual({
      ...box,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    });
    // Under the overlay, before it in drawing order: the art, the content, then the badge.
    expect(wrapper?.children.map((child) => (child as ReactTestInstance).props.style)).toEqual([
      art?.props.style,
      body?.props.style,
      badge?.props.style,
    ]);
  });

  it('an overlay before a padding is sized to the view without it', () => {
    const [outer, inner] = views(
      mount(toElement(VStack(Text('a')).overlay(Text('b')).padding('md'))),
    );
    expect(outer?.props.style).toMatchObject({ paddingTop: 12 });
    expect(inner?.props.style).toBeUndefined();
  });
});

describe('ZStack', () => {
  /** Each slot measures as the height its child gives it: `a` 20, `bb` 40. */
  function mountMeasured(element: ReactElement): ReactTestRenderer {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        createElement(PaintContext.Provider, { value: LIGHT }, element),
        {
          createNodeMock: (host) => {
            const child = (host.props as { children?: ReactElement }).children;
            const text = (child?.props as { children?: unknown } | undefined)?.children;
            return { offsetHeight: text === 'bb' ? 40 : 20 };
          },
        },
      );
    });
    return renderer;
  }

  it('is as tall as its tallest child; each child sits at the alignment without moving another', () => {
    const r = mountMeasured(toElement(ZStack(Text('a'), Text('bb')).alignment('bottom-trailing')));
    const [stack, box, a, bb] = views(r);
    expect(stack?.props.style).toEqual({ position: 'relative' });
    expect(box?.props.style).toEqual([
      { flexGrow: 1, justifyContent: 'flex-end' },
      { minHeight: 40 },
    ]);
    // Each slot takes back its own height: the slots share one line, at the bottom.
    expect(a?.props.style).toEqual([
      { position: 'static', alignItems: 'flex-end' },
      { marginTop: -20, marginBottom: -0 },
    ]);
    expect(bb?.props.style).toEqual([
      { position: 'static', alignItems: 'flex-end' },
      { marginTop: -40, marginBottom: -0 },
    ]);
    expect(a?.props.pointerEvents).toBe('box-none');
  });

  it('is centred by default: half of each child above the line, half below', () => {
    const r = mountMeasured(toElement(ZStack(Text('a'), Text('bb'))));
    const [, box, a] = views(r);
    expect(box?.props.style).toEqual([
      { flexGrow: 1, justifyContent: 'center' },
      { minHeight: 40 },
    ]);
    expect(a?.props.style).toEqual([
      { position: 'static', alignItems: 'center' },
      { marginTop: -10, marginBottom: -10 },
    ]);
  });

  it('a child pinned to its parent covers the stack and takes no part in its size', () => {
    const r = mountMeasured(toElement(ZStack(Text('bb'), Fill()).alignment('top-leading')));
    const [, box, , fillSlot] = views(r);
    // The fill's slot is static, so the fill is pinned to the stack; its slot measures 20 here
    // only because the mock does: on a device it is 0, and the tallest child sizes the box.
    expect(box?.props.style).toEqual([
      { flexGrow: 1, justifyContent: 'flex-start' },
      { minHeight: 40 },
    ]);
    expect(fillSlot?.props.style[0]).toEqual({ position: 'static', alignItems: 'flex-start' });
  });

  it('before it is measured the children are in their slots, unmoved', () => {
    const [, box, a] = views(mount(toElement(ZStack(Text('a'), Text('b')).alignment('top'))));
    expect(box?.props.style).toEqual({ flexGrow: 1, justifyContent: 'flex-start' });
    expect(a?.props.style).toEqual({ position: 'static', alignItems: 'center' });
  });
});

describe('elevation and rings', () => {
  it('a shadow is Bloom’s elevation role; after a corner it is a view of its own that follows the radius', () => {
    const [shadowed] = views(mount(toElement(VStack(Text('a')).shadow('m'))));
    expect(shadowed?.props.style).toEqual({ boxShadow: SHADOW_BOX.m });
    const [outer, clipped] = views(mount(toElement(VStack(Text('a')).corner('lg').shadow('s'))));
    expect(outer?.props.style).toEqual({ boxShadow: SHADOW_BOX.s, borderRadius: 16 });
    expect(clipped?.props.style).toEqual({ borderRadius: 16, overflow: 'hidden' });
  });

  it('a ring is an outline in a colour role, at a border width and an offset', () => {
    const [ringed] = views(mount(toElement(VStack(Text('a')).ring('primary', 'thick', '2xs'))));
    expect(ringed?.props.style).toEqual({
      outlineColor: LIGHT.primary,
      outlineStyle: 'solid',
      outlineWidth: 2,
      outlineOffset: 2,
    });
  });
});

describe('Shape', () => {
  const ofType = (renderer: ReactTestRenderer, type: string): ReactTestInstance[] =>
    renderer.root.findAll((instance) => (instance.type as unknown) === type);

  it('fills Bloom’s silhouette in the foreground by default, at a space rung', () => {
    const r = mount(toElement(Shape('heart').size('xl')));
    expect(ofType(r, 'ShapeFill')[0]?.props).toEqual({
      shape: 'heart',
      size: 20,
      color: LIGHT.text,
    });
    const sized = mount(toElement(Shape('circle')));
    expect(ofType(sized, 'ShapeFill')[0]?.props.size).toBe(40);
  });

  it('the last of fill, stroke and image is what it draws; a box is a view around it', () => {
    const r = mount(
      toElement(Shape('squircle').fill('muted').stroke('primary', 'thick').padding('xs')),
    );
    expect(ofType(r, 'ShapeFill')).toHaveLength(0);
    expect(ofType(r, 'ShapeBorder')[0]?.props).toEqual({
      shape: 'squircle',
      size: 40,
      width: 2,
      colors: LIGHT.primary,
    });
    expect(views(r)[0]?.props.style).toMatchObject({ paddingTop: 4 });
    const image = mount(toElement(Shape('flower').image({ uri: 'a.png' }, 'Ana')));
    expect(ofType(image, 'ShapeImage')[0]?.props).toEqual({
      shape: 'flower',
      size: 40,
      source: { uri: 'a.png' },
      alt: 'Ana',
    });
  });
});
