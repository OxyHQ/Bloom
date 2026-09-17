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
import { Badge, BADGE_GEOMETRY, resolveBadgePaint } from '../badge';
import { resolveButtonRamps } from '../button/shared';
import { RiKey2Line } from '../icons/remix/RiKey2Line';
import { useTheme } from '../theme/use-theme';
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
    const core = (variant: 'outlined' | 'solid') => {
      const { toJSON } = renderWithTheme(<Badge dot variant={variant} color="success" testID="b" />);
      const halo = findHost(toJSON(), 'b');
      const children = renderedChildren(toJSON(), 'b');
      expect(children).toHaveLength(1);
      return {
        halo: resolvedStyle(halo?.props.style),
        core: resolvedStyle(children[0]?.props.style),
      };
    };
    const outlined = core('outlined');
    const solid = core('solid');
    expect(outlined.core.backgroundColor).toBe(solid.core.backgroundColor);
    expect(outlined.core.backgroundColor).not.toBe('transparent');
    expect(outlined.halo.backgroundColor).not.toBe(outlined.core.backgroundColor);
  });

  it('draws a standalone dot as a 12px halo around a 6px centre at medium', () => {
    const { toJSON } = renderWithTheme(<Badge dot color="primary" testID="b" />);
    const halo = resolvedStyle(findHost(toJSON(), 'b')?.props.style);
    const core = resolvedStyle(renderedChildren(toJSON(), 'b')[0]?.props.style);
    expect(halo).toMatchObject({ width: 12, height: 12, borderRadius: borderRadius.full });
    expect(core).toMatchObject({ width: 6, height: 6 });
  });

  it('keeps an attached dot a plain marker', () => {
    const { toJSON } = renderWithTheme(
      <Badge dot color="primary">
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
      paddingLeft: 4,
      paddingRight: 4,
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

  // --- the label rungs ---------------------------------------------------

  it.each([
    ['label-small', 20, 8, 12, 12],
    ['label-medium', 24, 10, 13, 14],
  ] as const)(
    '%s is a %ipx pill with %ipx sides, %i/… semibold and a %ipx icon',
    (size, height, padding, fontSize, icon) => {
      const { getByTestId, getByText } = renderWithTheme(
        <Badge size={size} variant="subtle" color="info" content="For rent" testID="b" />,
      );
      const style = resolvedStyle(getByTestId('b').props.style);
      expect(style).toMatchObject({
        height,
        paddingLeft: padding,
        paddingRight: padding,
        borderRadius: borderRadius.full,
      });
      // A word yields before the card around it does: it shrinks and truncates,
      // where a COUNTER rung pins minWidth to its height and never shrinks.
      expect(style.flexShrink).toBe(1);
      expect(style.minWidth).toBe(0);
      expect(resolvedStyle(getByText('For rent').props.style).fontSize).toBe(fontSize);
      expect(BADGE_GEOMETRY[size].icon).toBe(icon);
    },
  );

  it('draws the leading icon at the rung size, in the label colour, hidden from assistive tech', () => {
    const { getByTestId, UNSAFE_getByType } = renderWithTheme(
      <Badge size="label-medium" variant="subtle" color="info" icon={RiKey2Line} content="For rent" testID="b" />,
    );
    // `includeHiddenElements`, because the slot is hidden from assistive
    // technology — which is the property being asserted.
    const slot = getByTestId('b-icon', { includeHiddenElements: true });
    expect(slot.props['aria-hidden']).toBe(true);
    expect(slot.props.importantForAccessibility).toBe('no-hide-descendants');
    const svg = UNSAFE_getByType(RiKey2Line as never);
    expect(svg.props.width).toBe(14);
    expect(svg.props.height).toBe(14);
  });

  it('tucks the leading padding in by 2 when it carries an icon', () => {
    const withIcon = renderWithTheme(<Badge size="label-medium" icon={RiKey2Line} content="x" testID="b" />);
    const style = resolvedStyle(withIcon.getByTestId('b').props.style);
    expect(style.paddingLeft).toBe(8);
    expect(style.paddingRight).toBe(10);
    expect(style.gap).toBe(4);
  });

  it('never renders an icon slot without an icon', () => {
    const { queryByTestId } = renderWithTheme(<Badge size="label-small" content="Swap" testID="b" />);
    expect(queryByTestId('b-icon', { includeHiddenElements: true })).toBeNull();
  });

  // --- onMedia -------------------------------------------------------------

  it.each(['light', 'dark'] as const)(
    'onMedia is the same light pill with a shadow in %s, whatever the tone',
    (mode) => {
      const { getByTestId, getByText, UNSAFE_getByType } = render(
        <BloomThemeProvider mode={mode} colorPreset="oxy">
          <Badge variant="onMedia" color="error" size="label-medium" icon={RiKey2Line} content="Swap" testID="b" />
        </BloomThemeProvider>,
      );
      const style = resolvedStyle(getByTestId('b').props.style);
      // The photograph under it does not change with the mode, so neither does
      // the pill: the neutral ramp's 50 with a 900 label, in both modes.
      expect(style.backgroundColor).toBeTruthy();
      expect(style.boxShadow ?? style.shadowColor).toBeTruthy();
      const label = resolvedStyle(getByText('Swap').props.style);
      expect(UNSAFE_getByType(RiKey2Line as never).props.fill).toBe(label.color);
    },
  );

  it('onMedia ignores the tone, and stays LIGHT-on-dark in dark mode', () => {
    const paint = (mode: 'light' | 'dark', color: 'error' | 'success') => {
      let out: ReturnType<typeof resolveBadgePaint> | null = null;
      function Probe() {
        out = resolveBadgePaint(useTheme(), color, 'onMedia');
        return null;
      }
      render(
        <BloomThemeProvider mode={mode} colorPreset="oxy">
          <Probe />
        </BloomThemeProvider>,
      );
      return out!;
    };
    // The tone is not in the recipe at all: a red "Sold" and a green "New" are
    // the same pill over a photograph.
    expect(paint('light', 'error')).toEqual(paint('light', 'success'));
    expect(paint('dark', 'error')).toEqual(paint('dark', 'success'));
    // And the mode does not FLIP it. The neutral ramp is theme-derived, so the
    // two modes land a unit or two apart per channel rather than identical —
    // what must hold is that dark mode does not hand back a dark pill with a
    // light label, which is what a tone-following badge would do over a photo.
    const [light, dark] = [paint('light', 'error'), paint('dark', 'error')];
    const lum = (c: string) => c.split(/[^0-9.]+/).filter(Boolean).slice(0, 3).reduce((a, b) => a + Number(b), 0);
    expect(lum(dark.background)).toBeGreaterThan(lum(dark.foreground));
    expect(Math.abs(lum(dark.background) - lum(light.background))).toBeLessThan(10);
  });

  it('onMedia reads the neutral ramp rather than a hand-written colour', () => {
    let ramp: ReturnType<typeof resolveButtonRamps> | null = null;
    let paint: ReturnType<typeof resolveBadgePaint> | null = null;
    function Probe() {
      const theme = useTheme();
      ramp = resolveButtonRamps(theme);
      paint = resolveBadgePaint(theme, 'default', 'onMedia');
      return null;
    }
    render(
      <BloomThemeProvider mode="dark" colorPreset="oxy">
        <Probe />
      </BloomThemeProvider>,
    );
    expect(paint!.background).toBe(ramp!.neutral[50]);
    expect(paint!.foreground).toBe(ramp!.neutral[900]);
    expect(paint!.shadow).toBe('s');
  });

  it('grows with size rather than clipping the label', () => {
    const small = renderWithTheme(<Badge content="x" size="small" testID="b" />);
    const large = renderWithTheme(<Badge content="x" size="large" testID="b" />);
    const smallHeight = resolvedStyle(small.getByTestId('b').props.style).height;
    const largeHeight = resolvedStyle(large.getByTestId('b').props.style).height;
    expect(Number(largeHeight)).toBeGreaterThan(Number(smallHeight));
  });
});
