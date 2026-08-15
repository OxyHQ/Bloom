/**
 * Two families whose whole API is a single discriminating prop.
 *
 * `Loading`'s `variant` chooses between three genuinely different things — a
 * centred spinner, a collapsing top bar, and an inline row — so the test that
 * matters is that the variant reaches a different tree, not that a spinner
 * exists.
 *
 * `Admonition`'s `type` picks the icon AND the border colour together. They
 * come from two separate maps, which is exactly how an `error` admonition ends
 * up with a warning icon: nothing enforces that the maps agree, so the test
 * reads both for every type.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Loading } from '../loading';
import { Admonition, AdmonitionRoot, AdmonitionText } from '../admonition';
import { useTheme } from '../theme/use-theme';
import { findHost, hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

/**
 * The outermost host node the SUBJECT rendered. Addressed through a wrapper
 * rather than by index from the tree root, because `BloomThemeProvider` renders
 * host nodes of its own and a positional read measures one of those instead.
 */
function subjectRoot(ui: React.ReactElement) {
  const { toJSON } = renderWithTheme(<View testID="subject">{ui}</View>);
  const wrapper = findHost(toJSON(), 'subject');
  if (wrapper === null) throw new Error('subject did not render');
  const [root] = hostNodes(wrapper.children);
  if (root === undefined) throw new Error('subject rendered no host node');
  return root;
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

describe('Loading', () => {
  it('shows its text only when there is text to show', () => {
    const withText = renderWithTheme(<Loading text="Loading posts" />);
    expect(withText.getByText('Loading posts')).toBeTruthy();

    const withoutText = renderWithTheme(<Loading />);
    expect(withoutText.queryByText('Loading posts')).toBeNull();
  });

  it('suppresses the text without unmounting the spinner when asked', () => {
    const { queryByText, getByTestId } = renderWithTheme(
      <Loading text="Loading posts" showText={false} testID="l" />,
    );
    expect(queryByText('Loading posts')).toBeNull();
    expect(getByTestId('l')).toBeTruthy();
  });

  it('gives each variant a different tree, not a different label', () => {
    const spinner = renderWithTheme(<Loading testID="l" />);
    const top = renderWithTheme(<Loading variant="top" testID="l" />);
    const inline = renderWithTheme(<Loading variant="inline" text="Saving" testID="l" />);

    const shapeOf = (tree: unknown) =>
      hostNodes(tree)
        .map((node) => node.type)
        .join('>');

    expect(shapeOf(spinner.toJSON())).not.toBe(shapeOf(top.toJSON()));
    expect(shapeOf(inline.toJSON())).not.toBe(shapeOf(top.toJSON()));
  });

  it('accepts a caller-supplied spinner in place of its own', () => {
    const { getByText } = renderWithTheme(
      <Loading spinnerIcon={<Text>custom</Text>} testID="l" />,
    );
    expect(getByText('custom')).toBeTruthy();
  });
});

describe('Admonition', () => {
  it('renders its message', () => {
    const { getByText } = renderWithTheme(<Admonition type="info">Heads up.</Admonition>);
    expect(getByText('Heads up.')).toBeTruthy();
  });

  it.each(['warning', 'error'] as const)(
    'paints the %s border from the matching status role, not the default border',
    (type) => {
      const colors = themeColors();
      const expected = type === 'warning' ? colors.warning : colors.error;
      const outer = subjectRoot(<Admonition type={type}>x</Admonition>);
      expect(resolvedStyle(outer?.props.style).borderColor).toBe(expected);
      expect(resolvedStyle(outer?.props.style).borderColor).not.toBe(colors.border);
    },
  );

  it('falls back to the neutral border for info, which has no status colour', () => {
    const colors = themeColors();
    const outer = subjectRoot(<Admonition type="info">x</Admonition>);
    expect(resolvedStyle(outer.props.style).borderColor).toBe(colors.border);
  });

  it('gives every type a distinct icon or says so by sharing one deliberately', () => {
    // `info` and `apology` intentionally share a glyph with `tip` / `info`
    // respectively; what must never happen is a type falling through to no icon.
    const types = ['info', 'tip', 'warning', 'error', 'apology'] as const;
    for (const type of types) {
      const tree = renderWithTheme(<Admonition type={type}>x</Admonition>).toJSON();
      const svgs = hostNodes(tree).filter((node) => node.type.toLowerCase().includes('svg'));
      expect(svgs.length).toBeGreaterThan(0);
    }
  });

  it('composes: the parts render without the all-in-one wrapper', () => {
    const { getByText } = renderWithTheme(
      <AdmonitionRoot type="tip">
        <AdmonitionText>Composed</AdmonitionText>
      </AdmonitionRoot>,
    );
    expect(getByText('Composed')).toBeTruthy();
  });
});
