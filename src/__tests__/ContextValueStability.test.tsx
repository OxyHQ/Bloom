/**
 * What a Screen and a group of panels publish to everything inside them is the
 * same object while what it says is the same. A Screen draws again whenever its
 * bottom bar does (a status line's text), and panels whenever a panel's content
 * does (a selection in a list); a value made anew at each of those made React
 * draw every reader below them again: a click in Stash's list on OxyOS redrew
 * its whole header and toolbar.
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppShellPanels, useAppShellPanel } from '../app-shell';
import { useAppShellRegion } from '../layout/app-shell-region';
import { Screen } from '../screen';
import { useSurfaceFillRecipe } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { mockWindowSize } from './support/window-size';

function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}

beforeEach(() => mockWindowSize({ width: 1280, height: 800, scale: 1, fontScale: 1 }));
afterEach(() => jest.restoreAllMocks());

it('keeps a recipe while its deps stay the same, and makes a new one when one changes', () => {
  const recipes: unknown[] = [];
  function Probe({ fill }: { fill: string }) {
    recipes.push(useThemeRecipe(() => ({ fill }), [fill]));
    return null;
  }
  const tree = render(wrap(<Probe fill="#fff" />));
  tree.rerender(wrap(<Probe fill="#fff" />));
  expect(recipes[1]).toBe(recipes[0]);
  tree.rerender(wrap(<Probe fill="#000" />));
  expect(recipes[2]).not.toBe(recipes[1]);
  expect((recipes[2] as { current: { fill: string } }).current.fill).toBe('#000');
});

it('does not draw what reads its surface again when only its bottom bar changed', () => {
  let renders = 0;
  function Reader() {
    useSurfaceFillRecipe();
    renders += 1;
    return null;
  }
  const reader = <Reader />;
  const ui = (status: string) =>
    wrap(
      <Screen scroll="none" bottomBar={<Text>{status}</Text>}>
        {reader}
      </Screen>,
    );
  const tree = render(ui('21 items'));
  const first = renders;
  tree.rerender(ui('1 of 21 selected'));
  expect(tree.getByText('1 of 21 selected')).toBeTruthy();
  expect(renders).toBe(first);
});

it('does not draw what reads a panel or its region again when another panel changed', () => {
  let renders = 0;
  function Reader() {
    useAppShellPanel();
    useAppShellRegion();
    renders += 1;
    return null;
  }
  const reader = <Reader />;
  const ui = (preview: string) =>
    wrap(
      <AppShellPanels
        scope="local"
        layout={{
          mode: 'split',
          flow: 'bounded',
          panels: [
            { id: 'items', content: reader },
            { id: 'preview', width: 280, content: <Text>{preview}</Text> },
          ],
        }}
      />,
    );
  const tree = render(ui('notes.md'));
  const first = renders;
  tree.rerender(ui('report.pdf'));
  expect(tree.getByText('report.pdf')).toBeTruthy();
  expect(renders).toBe(first);
});
