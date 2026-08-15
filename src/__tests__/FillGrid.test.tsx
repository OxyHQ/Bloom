/**
 * Two layout primitives whose value is entirely in the style object they emit,
 * so that object is what the test reads.
 *
 * `Fill` replaces the four-line absolute-inset block written inline wherever a
 * scrim, gradient or press layer has to cover its parent exactly. Getting three
 * of the four edges right is the failure it removes.
 *
 * `Row`/`Col` implement a gutter the way a grid must: the row pulls out by half
 * a gap on each side and each column pads in by half, so the OUTER edges of the
 * row line up with surrounding content while the columns are still separated.
 * A row that only padded its columns would inset the whole grid.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { Fill } from '../fill';
import { Row, Col } from '../grid';
import { findHost, hostNodes, resolvedStyle, type StyleEntry } from './support/rendered-style';

/** The resolved style of every host node the SUBJECT rendered, in document order. */
function styles(ui: React.ReactElement): StyleEntry[] {
  const { toJSON } = render(<View testID="subject">{ui}</View>);
  const wrapper = findHost(toJSON(), 'subject');
  if (wrapper === null) throw new Error('subject did not render');
  return hostNodes(wrapper.children).map((node) => resolvedStyle(node.props.style));
}

/** The subject's own outermost style. */
function rootStyle(ui: React.ReactElement): StyleEntry {
  const [root] = styles(ui);
  if (root === undefined) throw new Error('subject rendered no host node');
  return root;
}

describe('Fill', () => {
  it('pins all four edges, not three', () => {
    const style = rootStyle(
      <Fill>
        <Text>x</Text>
      </Fill>,
    );
    expect(style.position).toBe('absolute');
    expect(style.top).toBe(0);
    expect(style.right).toBe(0);
    expect(style.bottom).toBe(0);
    expect(style.left).toBe(0);
  });

  it('lets a caller override one edge without losing the others', () => {
    const style = rootStyle(<Fill style={{ left: '50%' }} />);
    expect(style.left).toBe('50%');
    expect(style.right).toBe(0);
    expect(style.position).toBe('absolute');
  });
});

describe('Row and Col gutters', () => {
  it('pulls the row out by half the gap so the grid edges stay flush', () => {
    const style = rootStyle(
      <Row gap={16}>
        <Col>
          <Text>a</Text>
        </Col>
      </Row>,
    );
    expect(style.flexDirection).toBe('row');
    expect(style.marginLeft).toBe(-8);
    expect(style.marginRight).toBe(-8);
  });

  it('pads each column in by half the gap, read from the row', () => {
    const [, column] = styles(
      <Row gap={16}>
        <Col>
          <Text>a</Text>
        </Col>
      </Row>,
    );
    expect(column?.paddingLeft).toBe(8);
    expect(column?.paddingRight).toBe(8);
  });

  it('gives a column a percentage width from its fraction', () => {
    const [, column] = styles(
      <Row>
        <Col width={0.25}>
          <Text>a</Text>
        </Col>
      </Row>,
    );
    expect(column?.width).toBe('25%');
  });

  it('gives a column outside any row no gutter rather than throwing', () => {
    const style = rootStyle(
      <Col>
        <Text>a</Text>
      </Col>,
    );
    expect(style.paddingLeft).toBe(0);
  });
});
