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
import { borderRadius } from '../styles/tokens';
import {
  findHost,
  hostNodes,
  renderedChildren,
  resolvedStyle,
} from './support/rendered-style';

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
    // circle: visually absent, with markup that reads as correct. A standalone
    // dot is the status dot, so the fill is its CENTRE, on a tint halo.
    const core = (variant: 'outline' | 'solid') => {
      const { toJSON } = renderWithTheme(<Badge dot appearance={variant} tone="success" testID="b" />);
      const halo = findHost(toJSON(), 'b');
      const children = renderedChildren(toJSON(), 'b');
      expect(children).toHaveLength(1);
      return {
        halo: resolvedStyle(halo?.props.style),
        core: resolvedStyle(children[0]?.props.style),
      };
    };
    const outlined = core('outline');
    const solid = core('solid');
    expect(outlined.core.backgroundColor).toBe(solid.core.backgroundColor);
    expect(outlined.core.backgroundColor).not.toBe('transparent');
    expect(outlined.halo.backgroundColor).not.toBe(outlined.core.backgroundColor);
  });

  it('draws a standalone dot as a 12px halo around a 6px centre at medium', () => {
    const { toJSON } = renderWithTheme(<Badge dot tone="accent" testID="b" />);
    const halo = resolvedStyle(findHost(toJSON(), 'b')?.props.style);
    const core = resolvedStyle(renderedChildren(toJSON(), 'b')[0]?.props.style);
    expect(halo).toMatchObject({ width: 12, height: 12, borderRadius: borderRadius.full });
    expect(core).toMatchObject({ width: 6, height: 6 });
  });

  it('keeps an attached dot a plain marker', () => {
    const { toJSON } = renderWithTheme(
      <Badge dot tone="accent">
        <Text>Inbox</Text>
      </Badge>,
    );
    const dot = hostNodes(toJSON())
      .map((node) => resolvedStyle(node.props.style))
      .find((style) => style.position === 'absolute');
    expect(dot).toMatchObject({ width: 8, height: 8 });
  });

  it('matches the counter at medium: an 18px pill, 12/16 semibold, 4px padding', () => {
    const { getByTestId, getByText } = renderWithTheme(<Badge content={12} testID="b" />);
    expect(resolvedStyle(getByTestId('b').props.style)).toMatchObject({
      height: 18,
      minWidth: 18,
      paddingHorizontal: 4,
      borderRadius: borderRadius.full,
    });
    expect(resolvedStyle(getByText('12').props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      letterSpacing: 0,
    });
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
    const small = renderWithTheme(<Badge content="x" size="sm" testID="b" />);
    const large = renderWithTheme(<Badge content="x" size="lg" testID="b" />);
    const smallHeight = resolvedStyle(small.getByTestId('b').props.style).height;
    const largeHeight = resolvedStyle(large.getByTestId('b').props.style).height;
    expect(Number(largeHeight)).toBeGreaterThan(Number(smallHeight));
  });
});
