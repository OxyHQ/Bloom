/**
 * `Badge` has two shapes behind one component — an inline pill and an overlay
 * on a child — and three props whose whole job is to prevent a specific
 * mistake: `max` (a four-digit count stretching a nav icon off screen),
 * `invisible` (a count reaching zero and reflowing the row), and `dot` (which
 * has no label, so it must ignore the variant rather than paint a transparent
 * circle).
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Badge } from '../badge';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Badge', () => {
  it('renders its content as the label', () => {
    const { getByText } = renderWithTheme(<Badge content="new" />);
    expect(getByText('new')).toBeTruthy();
  });

  it('caps a count at max and appends a plus', () => {
    const { getByText } = renderWithTheme(<Badge content={1204} max={99} />);
    expect(getByText('99+')).toBeTruthy();
  });

  it('leaves a count at or below max alone', () => {
    const { getByText } = renderWithTheme(<Badge content={99} max={99} />);
    expect(getByText('99')).toBeTruthy();
  });

  it('does not cap a string, which has no ordering to compare', () => {
    const { getByText } = renderWithTheme(<Badge content="1204" max={99} />);
    expect(getByText('1204')).toBeTruthy();
  });

  it('drops the label entirely when it is a dot', () => {
    const { queryByText } = renderWithTheme(<Badge dot content={7} />);
    expect(queryByText('7')).toBeNull();
  });

  it('paints a dot with the tone fill whatever the variant', () => {
    // `dot variant="outlined"` following the variant produced a transparent
    // circle: visually absent, with markup that reads as correct.
    const outlined = renderWithTheme(<Badge dot variant="outlined" color="success" testID="b" />);
    const solid = renderWithTheme(<Badge dot variant="solid" color="success" testID="b" />);
    const outlinedBg = resolvedStyle(outlined.getByTestId('b').props.style).backgroundColor;
    expect(outlinedBg).toBe(resolvedStyle(solid.getByTestId('b').props.style).backgroundColor);
    expect(outlinedBg).not.toBe('transparent');
  });

  it('unmounts a standalone badge when invisible', () => {
    const { queryByTestId } = renderWithTheme(<Badge content={3} invisible testID="b" />);
    expect(queryByTestId('b')).toBeNull();
  });

  it('keeps the child mounted when an attached badge is invisible', () => {
    // This is the whole point of `invisible` over conditional rendering: a
    // count reaching zero must not reflow the row it sits in.
    const { getByText, queryByText } = renderWithTheme(
      <Badge content={3} invisible testID="b">
        <Text>Inbox</Text>
      </Badge>,
    );
    expect(getByText('Inbox')).toBeTruthy();
    expect(queryByText('3')).toBeNull();
  });

  it('positions an attached badge absolutely at the requested corner', () => {
    const { toJSON } = renderWithTheme(
      <Badge content={1} placement="bottom-left">
        <Text>Inbox</Text>
      </Badge>,
    );
    const positioned = hostNodes(toJSON())
      .map((node) => resolvedStyle(node.props.style))
      .filter((style) => style.position === 'absolute');
    expect(positioned).toHaveLength(1);
    expect(positioned[0]?.bottom).toBe(-4);
    expect(positioned[0]?.left).toBe(-4);
    expect(positioned[0]?.top).toBeUndefined();
  });

  it('grows with size rather than clipping the label', () => {
    const small = renderWithTheme(<Badge content="x" size="small" testID="b" />);
    const large = renderWithTheme(<Badge content="x" size="large" testID="b" />);
    const smallHeight = resolvedStyle(small.getByTestId('b').props.style).height;
    const largeHeight = resolvedStyle(large.getByTestId('b').props.style).height;
    expect(Number(largeHeight)).toBeGreaterThan(Number(smallHeight));
  });
});
