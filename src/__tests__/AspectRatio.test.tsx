/**
 * `AspectRatio` exists to stop a media well from jumping as its image loads, and
 * everything that can go wrong with it is a STYLE fact rather than a rendered
 * one: the ratio reaching the wrong property, the `100%` width disappearing, the
 * caller's `style` losing the merge order, or a wrapper appearing around the one
 * node the parent lays out. jsdom has no layout engine, so what is asserted here
 * is what actually landed on the node — which is the whole contract for a
 * component whose entire body is one `View` and two style keys.
 *
 * The degenerate case is included too — the last test — because the ratio a
 * caller could not compute (`w / h` before an image has loaded) is the one that
 * reaches this component in production, and rescuing it is a decision that has
 * to stay pinned rather than be re-derived by the next reader.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AspectRatio } from '../aspect-ratio';
import { findHost, hostNodes, renderedChildren, resolvedStyle } from './support/rendered-style';

/** The style that actually landed on the box, later entries winning. */
function boxStyle(ui: React.ReactElement): Record<string, unknown> {
  const host = findHost(render(ui).toJSON(), 'box');
  if (host === null) throw new Error('AspectRatio rendered no host node for testID "box"');
  return resolvedStyle(host.props.style);
}

describe('AspectRatio', () => {
  it('puts the caller’s ratio on `aspectRatio`, unmodified', () => {
    // Two ratios, because a single one cannot tell `ratio` from `1 / ratio` when
    // the value is 1, nor a hardcoded constant from the prop.
    expect(boxStyle(<AspectRatio testID="box" ratio={16 / 9} />).aspectRatio).toBeCloseTo(
      1.7778,
      4,
    );
    expect(boxStyle(<AspectRatio testID="box" ratio={0.5} />).aspectRatio).toBe(0.5);
  });

  it('defaults to a square', () => {
    expect(boxStyle(<AspectRatio testID="box" />).aspectRatio).toBe(1);
  });

  it('fills its parent’s width, so the box is never zero-sized', () => {
    // An aspect box with no width is zero-sized whatever its ratio: the height
    // is DERIVED from the width, so losing the width loses the component.
    expect(boxStyle(<AspectRatio testID="box" ratio={16 / 9} />).width).toBe('100%');
  });

  it('lets the caller’s `style` land last, which is how a fixed width is set', () => {
    // The documented escape hatch: "a caller who needs a fixed width passes it
    // through `style`, which lands last". Reverse the merge order and the
    // component's own `100%` would silently win.
    const style = boxStyle(<AspectRatio testID="box" ratio={1} style={{ width: 96 }} />);
    expect(style.width).toBe(96);
    // …and only the key the caller set moves.
    expect(style.aspectRatio).toBe(1);
  });

  it('is ONE node, so the parent lays out the box itself', () => {
    // A layout wrapper here would make every `className` and layout style the
    // parent applies land on something other than the aspect box — the failure
    // mode AGENTS.md records for `Button`, silent on native and invisible to a
    // prop-level test. `children` are rendered INSIDE it, not beside it.
    const tree = render(
      <AspectRatio testID="box" ratio={1}>
        <Text testID="child">well</Text>
      </AspectRatio>,
    ).toJSON();

    // Nothing above the box: the first host node in the tree IS the box, so the
    // parent's layout applies to the thing that carries the ratio.
    expect(hostNodes(tree)[0]?.props.testID).toBe('box');
    // …and nothing between the box and its children either, which is the half a
    // "does the child appear anywhere below" search cannot see.
    const children = renderedChildren(tree, 'box');
    expect(children).toHaveLength(1);
    expect(children[0]?.props.testID).toBe('child');
  });

  it('takes the default for a ratio that is not a ratio, rather than collapsing', () => {
    // `image.width / image.height` before the image has loaded is the one live
    // source of all four of these: `0 / 0` is NaN, `w / 0` is Infinity, `0 / h`
    // is 0, and a sign slip gives a negative. None of them describes a box, and
    // each one passed through leaves the well with no usable height — the exact
    // jump this component exists to prevent, silently and on both platforms.
    expect(boxStyle(<AspectRatio testID="box" ratio={Number.NaN} />).aspectRatio).toBe(1);
    expect(
      boxStyle(<AspectRatio testID="box" ratio={Number.POSITIVE_INFINITY} />).aspectRatio,
    ).toBe(1);
    expect(boxStyle(<AspectRatio testID="box" ratio={0} />).aspectRatio).toBe(1);
    expect(boxStyle(<AspectRatio testID="box" ratio={-16 / 9} />).aspectRatio).toBe(1);

    // …and the guard is a RANGE test, not a falsy one, which is the half that
    // decides whether the four above mean anything: a component hardcoding `1`
    // would satisfy every line so far. Extreme but coherent ratios still land
    // untouched.
    expect(boxStyle(<AspectRatio testID="box" ratio={0.01} />).aspectRatio).toBe(0.01);
    expect(boxStyle(<AspectRatio testID="box" ratio={1000} />).aspectRatio).toBe(1000);
  });
});
