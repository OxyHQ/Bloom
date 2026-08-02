import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar, AVATAR_SHAPE_PATHS, NAMED_SHAPE_VIEW_BOX } from '../avatar';
import { SQUIRCLE_PATH } from '../avatar/squircle-path';
import { resolveAvatarShape } from '../avatar/resolve-shape';

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
  return tree.UNSAFE_queryAllByType('Path' as never)
    .map((node) => String(node.props.d ?? ''))
    .filter(Boolean);
}

/** The `viewBox` of every `<Svg>` the tree rendered. */
function renderedViewBoxes(tree: ReturnType<typeof renderAvatar>): string[] {
  return tree.UNSAFE_queryAllByType('Svg' as never)
    .map((node) => String(node.props.viewBox ?? ''));
}

const URI = 'https://cloud.oxy.so/face.jpg';

describe('resolveAvatarShape', () => {
  it('resolves a circle to no outline so it stays off the SVG renderer', () => {
    expect(resolveAvatarShape('circle')).toBeNull();
    expect(resolveAvatarShape(undefined)).toBeNull();
  });

  it('resolves the built-in squircle in its own 0-1 space', () => {
    expect(resolveAvatarShape('squircle')).toEqual({ d: SQUIRCLE_PATH, viewBox: 1 });
  });

  it('resolves a named shape in the 100-unit space its paths are written in', () => {
    expect(resolveAvatarShape('heart')).toEqual({
      d: AVATAR_SHAPE_PATHS.heart,
      viewBox: NAMED_SHAPE_VIEW_BOX,
    });
  });

  it('defaults a custom path to the 0-1 space when no viewBox is given', () => {
    expect(resolveAvatarShape({ d: 'M0 0H1V1H0Z' })).toEqual({ d: 'M0 0H1V1H0Z', viewBox: 1 });
  });

  it('keeps an explicit viewBox on a custom path', () => {
    expect(resolveAvatarShape({ d: 'M0 0H8V8H0Z', viewBox: 8 })).toEqual({
      d: 'M0 0H8V8H0Z',
      viewBox: 8,
    });
  });

  it('falls back to a circle for a name that is not in the registry', () => {
    // Reaches this branch when persisted user data holds a shape that a later
    // build dropped. A missing outline must degrade to a plain avatar, never to
    // an empty clip that renders nothing.
    expect(resolveAvatarShape('trapezoid' as 'heart')).toBeNull();
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
    expect(renderedPaths(tree)).toContain(AVATAR_SHAPE_PATHS.heart);
    expect(renderedViewBoxes(tree)).toContain('0 0 100 100');
  });

  it('clips to a caller-supplied outline', () => {
    const custom = 'M0 0H10V10H0Z';
    const tree = renderAvatar(<Avatar uri={URI} size={48} shape={{ d: custom, viewBox: 10 }} />);
    expect(renderedPaths(tree)).toContain(custom);
    expect(renderedViewBoxes(tree)).toContain('0 0 10 10');
  });

  it('every named shape resolves to a non-empty outline', () => {
    for (const [name, d] of Object.entries(AVATAR_SHAPE_PATHS)) {
      expect(d.startsWith('M')).toBe(true);
      expect(resolveAvatarShape(name as 'heart')).toEqual({
        d,
        viewBox: NAMED_SHAPE_VIEW_BOX,
      });
    }
  });
});

describe('Avatar ring follows the avatar outline', () => {
  it('strokes the named outline rather than a circle', () => {
    const tree = renderAvatar(
      <Avatar uri={URI} size={48} shape="heart" ring={{ colors: '#FF0000', width: 2 }} />,
    );
    expect(renderedPaths(tree)).toContain(AVATAR_SHAPE_PATHS.heart);
  });

  it('scales the stroke into the outline coordinate space', () => {
    // The ring is drawn in the path's own units, so a 2px stroke on a 48px
    // avatar is 2/48 of the box — expressed over a 100-unit space and doubled
    // to survive the viewport clipping half the centered stroke.
    const tree = renderAvatar(
      <Avatar uri={URI} size={48} shape="heart" ring={{ colors: '#FF0000', width: 2 }} />,
    );
    const ringPath = tree.UNSAFE_queryAllByType('Path' as never)
      .find((node) => node.props.stroke === '#FF0000');
    expect(ringPath).toBeDefined();
    expect(ringPath?.props.strokeWidth).toBeCloseTo((2 / 48) * 2 * 100);
  });

  it('keeps a solid circular ring on a plain bordered View', () => {
    const tree = renderAvatar(
      <Avatar uri={URI} size={48} ring={{ colors: '#FF0000', width: 2 }} />,
    );
    expect(renderedPaths(tree)).toHaveLength(0);
  });
});
