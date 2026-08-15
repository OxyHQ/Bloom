/**
 * `AspectRatio` exists to stop a media well from jumping as its image loads, and
 * everything that can go wrong with it is a STYLE fact rather than a rendered
 * one: the ratio reaching the wrong property, the `100%` width disappearing, the
 * caller's `style` losing the merge order, or a wrapper appearing around the one
 * node the parent lays out. jsdom has no layout engine, so what is asserted here
 * is what actually landed on the node — which is the whole contract for a
 * component whose entire body is one `View` and two style keys.
 *
 * The degenerate case is deliberately included and deliberately NOT rescued: see
 * the last test, which records what the component does today with a ratio the
 * caller could not compute (`w / h` before an image has loaded).
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

  it('passes a degenerate ratio straight through — only `undefined` takes the default', () => {
    // FINDING, pinned rather than fixed: `ratio` is a plain default parameter,
    // so it rescues `undefined` and nothing else. A caller computing
    // `image.width / image.height` before the image has loaded hands over `0 / 0`
    // (NaN) or `w / 0` (Infinity), and the box then has no usable aspect ratio at
    // all — it collapses to zero height, which is the exact jump this component
    // exists to prevent, with no error on either platform.
    //
    // Asserted as-is because a `|| 1` "fix" would also rewrite a deliberate `0`,
    // and because the value is what a future guard has to change on purpose.
    expect(boxStyle(<AspectRatio testID="box" ratio={0} />).aspectRatio).toBe(0);
    expect(boxStyle(<AspectRatio testID="box" ratio={Number.NaN} />).aspectRatio).toBeNaN();
  });
});
