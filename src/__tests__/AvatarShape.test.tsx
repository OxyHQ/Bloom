import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar } from '../avatar';
import { ImageResolverProvider } from '../image-resolver';
import { PATHS, PATH_VIEW_BOX, resolve } from '../shapes';
import { Image } from 'react-native';
import { SQUIRCLE_PATH } from '../shapes/squircle-path';

function renderAvatar(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/**
 * Every `<Path d="…">` the tree rendered, in order. Uses the query (not the
 * get) form so "no paths at all" is an empty array — that is the assertion the
 * circle cases make, not an error.
 */
function renderedPaths(tree: ReturnType<typeof renderAvatar>): string[] {
  return tree
    .UNSAFE_queryAllByType('Path' as never)
    .map((node) => String(node.props.d ?? ''))
    .filter(Boolean);
}

/** The `viewBox` of every `<Svg>` the tree rendered. */
function renderedViewBoxes(tree: ReturnType<typeof renderAvatar>): string[] {
  return tree
    .UNSAFE_queryAllByType('Svg' as never)
    .map((node) => String(node.props.viewBox ?? ''));
}

const URI = 'https://cloud.oxy.so/face.jpg';

describe('resolve', () => {
  it('resolves a circle to no outline so it stays off the SVG renderer', () => {
    expect(resolve('circle')).toBeNull();
    expect(resolve(undefined)).toBeNull();
  });

  it('resolves the built-in squircle in its own 0-1 space', () => {
    expect(resolve('squircle')).toEqual({ d: SQUIRCLE_PATH, viewBox: 1 });
  });

  it('resolves a named shape in the 100-unit space its paths are written in', () => {
    expect(resolve('heart')).toEqual({
      d: PATHS.heart,
      viewBox: PATH_VIEW_BOX,
    });
  });

  it('defaults a custom path to the 0-1 space when no viewBox is given', () => {
    expect(resolve({ d: 'M0 0H1V1H0Z' })).toEqual({
      d: 'M0 0H1V1H0Z',
      viewBox: 1,
    });
  });

  it('keeps an explicit viewBox on a custom path', () => {
    expect(resolve({ d: 'M0 0H8V8H0Z', viewBox: 8 })).toEqual({
      d: 'M0 0H8V8H0Z',
      viewBox: 8,
    });
  });

  it('falls back to a circle for a name that is not in the registry', () => {
    // Reaches this branch when persisted user data holds a shape that a later
    // build dropped. A missing outline must degrade to a plain avatar, never to
    // an empty clip that renders nothing.
    expect(resolve('trapezoid' as 'heart')).toBeNull();
  });
});

describe('Avatar shape rendering', () => {
  it('renders a circle without any SVG path', () => {
    const tree = renderAvatar(<Avatar uri={URI} size={48} />);
    expect(renderedPaths(tree)).toHaveLength(0);
  });

  it('clips to the squircle outline in a 0-1 viewport', () => {
    const tree = renderAvatar(<Avatar uri={URI} size={48} shape="squircle" />);
    expect(renderedPaths(tree)).toContain(SQUIRCLE_PATH);
    expect(renderedViewBoxes(tree)).toContain('0 0 1 1');
  });

  it('clips to a named outline in a 0-100 viewport', () => {
    const tree = renderAvatar(<Avatar uri={URI} size={48} shape="heart" />);
    expect(renderedPaths(tree)).toContain(PATHS.heart);
    expect(renderedViewBoxes(tree)).toContain('0 0 100 100');
  });

  it('clips to a caller-supplied outline', () => {
    const custom = 'M0 0H10V10H0Z';
    const tree = renderAvatar(
      <Avatar uri={URI} size={48} shape={{ d: custom, viewBox: 10 }} />,
    );
    expect(renderedPaths(tree)).toContain(custom);
    expect(renderedViewBoxes(tree)).toContain('0 0 10 10');
  });

  it('every named shape resolves to a non-empty outline', () => {
    for (const [name, d] of Object.entries(PATHS)) {
      expect(d.startsWith('M')).toBe(true);
      expect(resolve(name as 'heart')).toEqual({
        d,
        viewBox: PATH_VIEW_BOX,
      });
    }
  });
});

describe('Avatar ring follows the avatar outline', () => {
  it('strokes the named outline rather than a circle', () => {
    const tree = renderAvatar(
      <Avatar
        uri={URI}
        size={48}
        shape="heart"
        ring={{ colors: '#FF0000', width: 2 }}
      />,
    );
    expect(renderedPaths(tree)).toContain(PATHS.heart);
  });

  it('scales the stroke into the outline coordinate space', () => {
    // The ring is drawn in the path's own units, so a 2px stroke on a 48px
    // avatar is 2/48 of the box — expressed over a 100-unit space and doubled
    // to survive the viewport clipping half the centered stroke.
    const tree = renderAvatar(
      <Avatar
        uri={URI}
        size={48}
        shape="heart"
        ring={{ colors: '#FF0000', width: 2 }}
      />,
    );
    const ringPath = tree
      .UNSAFE_queryAllByType('Path' as never)
      .find((node) => node.props.stroke === '#FF0000');
    expect(ringPath).toBeDefined();
    expect(ringPath?.props.strokeWidth).toBeCloseTo((2 / 48) * 2 * 100);
    const id = ringPath?.props.clipPath?.slice(5, -1);
    const clip = tree
      .UNSAFE_queryAllByType('ClipPath' as never)
      .find((node) => node.props.id === id);
    expect(clip).toBeDefined();
    expect(clip?.findByType('Path' as never).props.d).toBe(PATHS.heart);
  });

  it('keeps a solid circular ring on a plain bordered View', () => {
    const tree = renderAvatar(
      <Avatar uri={URI} size={48} ring={{ colors: '#FF0000', width: 2 }} />,
    );
    expect(renderedPaths(tree)).toHaveLength(0);
  });
});

describe('Avatar silhouette across source and fallback states', () => {
  it.each([{ uri: URI }, 42])(
    'accepts object or local image sources: %p',
    (source) => {
      const tree = renderAvatar(
        <Avatar
          source={source}
          uri="https://ignored.example/image"
          shape="squircle"
          alt="Ada"
        />,
      );
      expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toEqual(
        source,
      );
      expect(
        tree.UNSAFE_getByType('Svg' as never).props.accessibilityLabel,
      ).toBe('Ada');
    },
  );

  it('retains a shaped fill for initials without a photo', () => {
    const tree = renderAvatar(<Avatar name="Ada" shape="heart" />);
    expect(tree.getByText('A')).toBeTruthy();
    expect(renderedPaths(tree)).toContain(PATHS.heart);
  });

  it('handles primary and fallback failures then recovers on source change', () => {
    const fallback = { uri: 'https://example.com/fallback.png' };
    const wrap = (uri: string) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar uri={uri} fallbackSource={fallback} name="Ada" shape="heart" />
      </BloomThemeProvider>
    );
    const tree = render(wrap(URI));
    fireEvent(tree.UNSAFE_getByType(Image), 'error', {
      nativeEvent: { error: 'failed' },
    });
    expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toEqual(
      fallback,
    );
    fireEvent(tree.UNSAFE_getByType(Image), 'error', {
      nativeEvent: { error: 'failed' },
    });
    expect(tree.UNSAFE_queryAllByType('SvgImage' as never)).toHaveLength(0);
    expect(tree.getByText('A')).toBeTruthy();
    expect(renderedPaths(tree)).toContain(PATHS.heart);
    tree.rerender(wrap('https://example.com/new.png'));
    expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toEqual({
      uri: 'https://example.com/new.png',
    });
  });

  it('keeps clip references unique and stable when avatars rerender', () => {
    const wrap = (size: number) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar uri={URI} shape="squircle" size={size} />
        <Avatar uri={URI} shape="squircle" size={size} />
      </BloomThemeProvider>
    );
    const tree = render(wrap(40));
    const ids = () =>
      tree
        .UNSAFE_queryAllByType('ClipPath' as never)
        .map((node) => node.props.id);
    const initial = ids();
    expect(new Set(initial).size).toBe(2);
    expect(initial.every((id) => /^[a-zA-Z0-9-]+$/.test(id))).toBe(true);
    tree.rerender(wrap(60));
    expect(ids()).toEqual(initial);
  });
});

describe('Avatar semantic image request identity', () => {
  it('does not retry failed primary/fallback when equivalent source objects are recreated', () => {
    const wrap = (reversed = false) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar
          shape="heart"
          name="Ada"
          source={
            reversed
              ? { height: 80, width: 80, uri: URI }
              : { uri: URI, width: 80, height: 80 }
          }
          fallbackSource={{ uri: 'https://example.com/fallback.png' }}
        />
      </BloomThemeProvider>
    );
    const tree = render(wrap());
    fireEvent(tree.UNSAFE_getByType(Image), 'error', {
      nativeEvent: { error: 'primary failed' },
    });
    tree.rerender(wrap(true));
    expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toEqual({
      uri: 'https://example.com/fallback.png',
    });
    fireEvent(tree.UNSAFE_getByType(Image), 'error', {
      nativeEvent: { error: 'fallback failed' },
    });
    tree.rerender(wrap());
    expect(tree.UNSAFE_queryAllByType('SvgImage' as never)).toHaveLength(0);
    expect(tree.getByText('A')).toBeTruthy();
  });

  it('retries when the same ID resolves to a different URI, even with a stable resolver', () => {
    let currentUri = URI;
    const resolver = () => currentUri;
    const wrap = (size: number) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ImageResolverProvider value={resolver}>
          <Avatar source="same-file-id" shape="heart" name="Ada" size={size} />
        </ImageResolverProvider>
      </BloomThemeProvider>
    );
    const tree = render(wrap(40));
    fireEvent(tree.UNSAFE_getByType(Image), 'error', {
      nativeEvent: { error: 'failed' },
    });
    expect(tree.getByText('A')).toBeTruthy();
    currentUri = 'https://example.com/refreshed.png';
    tree.rerender(wrap(48));
    expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toEqual({
      uri: currentUri,
    });
  });

  it('ignores repeated errors from the old primary after progressing to the fallback', () => {
    const tree = renderAvatar(
      <Avatar
        uri={URI}
        fallbackSource={{ uri: 'https://example.com/fallback.png' }}
        name="Ada"
        shape="heart"
      />,
    );
    const primary = tree.UNSAFE_getByType(Image);
    const primaryError = primary.props.onError;
    fireEvent(primary, 'error', { nativeEvent: { error: 'failed' } });
    const fallback = tree.UNSAFE_getByType(Image);
    fireEvent(fallback, 'error', { nativeEvent: { error: 'failed' } });
    // A late native event must not resurrect an already-failed request.
    act(() => primaryError({ nativeEvent: { error: 'late primary event' } }));
    expect(tree.UNSAFE_queryAllByType('SvgImage' as never)).toHaveLength(0);
  });
});
