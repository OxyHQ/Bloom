/**
 * Two small tinted primitives that share one hazard: the disc colour and the
 * glyph/dot colour on top of it are a PAIR, and moving one without the other
 * produces a control that is drawn correctly and invisible.
 *
 * `IconCircle` reads the pair from the theme (`primarySubtle` behind
 * `primary`); `RadioIndicator` reads `primaryForeground` for the inner dot so a
 * preset with a light primary gets a dark dot rather than a white one on a
 * near-white fill.
 */
import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { IconCircle } from '../icon-circle';
import { RadioIndicator } from '../radio-indicator';
import { useTheme } from '../theme/use-theme';
import { Bell_Stroke2_Corner0_Rounded as BellIcon } from '../icons/Bell';
import { findHost, hostNodes, resolvedStyle, type StyleEntry } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

/**
 * The resolved style of every host node the SUBJECT rendered, in document
 * order — addressed through a wrapper rather than by index from the tree root,
 * because `BloomThemeProvider` contributes host nodes of its own and a
 * positional read would silently be measuring one of those.
 */
function styles(ui: React.ReactElement): StyleEntry[] {
  const { toJSON } = renderWithTheme(<View testID="subject">{ui}</View>);
  const wrapper = findHost(toJSON(), 'subject');
  if (wrapper === null) throw new Error('subject did not render');
  return hostNodes(wrapper.children).map((node) => resolvedStyle(node.props.style));
}

function themeColors() {
  // Collected into an array rather than assigned to a `let`: TypeScript narrows
  // a closure-assigned variable to its initialiser, so the captured value would
  // type as `never` and every property read off it would be an error.
  const captured: Array<ReturnType<typeof useTheme>['colors']> = [];
  function Probe() {
    captured.push(useTheme().colors);
    return null;
  }
  renderWithTheme(<Probe />);
  const [colors] = captured;
  if (colors === undefined) throw new Error('theme probe did not render');
  return colors;
}

describe('IconCircle', () => {
  it('puts the primary glyph on the primarySubtle disc — the resolved pair', () => {
    const colors = themeColors();
    const rendered = styles(<IconCircle icon={BellIcon} />);
    expect(rendered.filter((s) => s.backgroundColor === colors.primarySubtle)).toHaveLength(1);
    expect(rendered.filter((s) => s.color === colors.primary).length).toBeGreaterThan(0);
  });

  it('is a circle at both sizes, and lg is smaller than xl', () => {
    const lg = styles(<IconCircle icon={BellIcon} size="lg" />)[0];
    const xl = styles(<IconCircle icon={BellIcon} size="xl" />)[0];
    expect(lg?.width).toBe(lg?.height);
    expect(Number(xl?.width)).toBeGreaterThan(Number(lg?.width));
    // `borderRadius.full` rather than half the width, so a caller resizing the
    // disc through `style` still gets a circle instead of a rounded square.
    expect(Number(lg?.borderRadius)).toBeGreaterThanOrEqual(Number(lg?.width));
  });

  it('lets a caller move the disc and the glyph together', () => {
    const rendered = styles(
      <IconCircle
        icon={BellIcon}
        style={{ backgroundColor: 'rgb(255 237 213)' }}
        iconStyle={{ color: 'rgb(154 52 18)' }}
      />,
    );
    expect(rendered.filter((s) => s.backgroundColor === 'rgb(255 237 213)')).toHaveLength(1);
    expect(rendered.filter((s) => s.color === 'rgb(154 52 18)').length).toBeGreaterThan(0);
  });
});

describe('RadioIndicator', () => {
  it('is a hollow ring when unselected: a border, no fill, no dot', () => {
    const rendered = styles(<RadioIndicator selected={false} />);
    expect(rendered[0]?.borderWidth).toBe(2);
    expect(rendered[0]?.backgroundColor).toBe('transparent');
    // The ring is the only node — a dot would be a second one.
    expect(rendered).toHaveLength(1);
  });

  it('fills and drops the border when selected, so the ring does not double up', () => {
    const colors = themeColors();
    const rendered = styles(<RadioIndicator selected />);
    expect(rendered[0]?.borderWidth).toBe(0);
    expect(rendered[0]?.backgroundColor).toBe(colors.primary);
    expect(rendered).toHaveLength(2);
  });

  it('draws the inner dot in the primary FOREGROUND, not white', () => {
    const colors = themeColors();
    const rendered = styles(<RadioIndicator selected />);
    expect(rendered[1]?.backgroundColor).toBe(colors.primaryForeground);
  });

  it('falls back to white for a caller-supplied fill it cannot reason about', () => {
    const rendered = styles(<RadioIndicator selected selectedColor="rebeccapurple" />);
    expect(rendered[0]?.backgroundColor).toBe('rebeccapurple');
    expect(rendered[1]?.backgroundColor).toBe('#FFFFFF');
  });

  it('scales the dot with the ring', () => {
    const rendered = styles(<RadioIndicator selected size={40} />);
    expect(rendered[0]?.width).toBe(40);
    expect(rendered[1]?.width).toBe(20);
  });
});
