jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Path: 'Path',
}));

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BottomSheet } from '../bottom-sheet';
import { ContentPanel } from '../content-panel';
import { ContentPanel as ContentPanelWeb } from '../content-panel/ContentPanel.web';
import { Dialog } from '../dialog/Dialog';
import { OverlayRoot } from '../overlay';
import { SettingsListGroup, SettingsListItem } from '../settings-list/SettingsList';
import { SETTINGS_LIST_GROUP_TEST_ID } from '../settings-list/surface';
import { contrastRatio } from '../styles/color-contrast';
import { SurfaceLevelProvider, resolveSurfaceLevel } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { findHost, resolvedStyle } from './support/rendered-style';

/**
 * A `SettingsListGroup` has to know what is behind it, and it cannot see its own
 * parent. Before this it was told, per call site, by a `variant` prop — which one
 * app repeated at ~75 of them, and a screen that forgot it rendered a `card`
 * group on a `card` panel: present, correct, invisible.
 *
 * The answer is the surface ladder (`styles/surface-levels.ts`): a container that
 * paints a surface publishes the COLOUR it painted, and the group resolves off
 * that colour — `card` on the page, one ladder step off the fill anywhere else
 * (`settings-list/surface.ts`). So there are three separate properties to pin,
 * and only the first is obvious:
 *
 *   1. the DEFAULT — the page gets `card`, every other surface gets a step that
 *      SEPARATES from it, with an explicit `variant` still winning both ways;
 *   2. the MODE — light and dark are two different pictures here. On a light
 *      page the ladder's rung 1 IS `colors.card`, so the page branch is
 *      invisible; and `backgroundSecondary` (what the first version of this
 *      default picked above the page) clears the just-noticeable floor in light
 *      and fails it in dark on the menu surface. A suite pinned to `mode="light"`
 *      cannot see either, which is why every case below runs twice, and why the
 *      rule itself is walked over presets x both modes in
 *      `surface-level-adoption.test.ts` — the file that exists for families
 *      measured against the ladder, and that samples presets rather than
 *      building all 128 themes (which crashes a jest worker — `AGENTS.md`);
 *   3. the RESET — a surface portaled out of the panel must not inherit the
 *      panel's surface. React context reaches through a portal and through an RN
 *      `<Modal>` even though neither paints anything, so without a reset the
 *      SAME dialog paints differently depending on where its trigger lives.
 *
 * Assertions name theme ROLES or MEASURE contrast. No hex literal appears here:
 * a preset change must be able to move every colour without touching this file.
 */

const MODES = ['light', 'dark'] as const;
type Mode = (typeof MODES)[number];

/**
 * The smallest fill step that reads as a step, taken from the ladder's own gate
 * (`surface-levels.test.ts` `FILL_JND`). Below it, two large flat patches are
 * one patch.
 */
const FILL_JND = 1.1;

/**
 * Render, and read the fill off the GROUP'S OWN card plus the live theme roles.
 *
 * The group is found by `testID`, not by elimination: a container may paint
 * through a `className` (`ContentPanel` does) and contribute no inline
 * background at all, so "the background that is not the container's" would
 * quietly start measuring whichever node happened to be left.
 */
function paint(mode: Mode, ui: () => React.ReactElement): { fill: string; colors: Theme['colors'] } {
  const ref: { current?: Theme['colors'] } = {};
  function Probe() {
    ref.current = useTheme().colors;
    return null;
  }
  const { toJSON } = render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      <Probe />
      {ui()}
    </BloomThemeProvider>,
  );
  const host = findHost(toJSON(), SETTINGS_LIST_GROUP_TEST_ID);
  if (!host) throw new Error('the settings group never rendered');
  const fill = resolvedStyle(host.props.style).backgroundColor;
  if (typeof fill !== 'string') throw new Error('the settings group painted no fill');
  if (!ref.current) throw new Error('theme probe never ran');
  return { fill, colors: ref.current };
}

const group = (variant?: 'plain' | 'filled') => (
  <SettingsListGroup variant={variant}>
    <SettingsListItem title="Row" />
  </SettingsListGroup>
);

describe.each(MODES)('the default resolves off the real surface (%s)', (mode) => {
  const theme = buildTheme('teal', mode);

  it('paints the `card` ROLE on the page, where a card is exactly what reads', () => {
    const { fill, colors } = paint(mode, () => group());
    expect(fill).toBe(colors.card);
  });

  it('steps off a published fill instead, with no prop at the call site', () => {
    const { fill, colors } = paint(mode, () => (
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        {group()}
      </SurfaceLevelProvider>
    ));
    expect(fill).not.toBe(colors.card);
    expect(contrastRatio(fill, colors.card)).toBeGreaterThanOrEqual(FILL_JND);
  });

  it('reads the fill a ContentPanel publishes — the case the prop was repeated for', () => {
    // The panel paints `card` and publishes that exact colour (#125). The group
    // has to separate from what the panel PAINTED, which in dark is not the rung
    // the panel sits at: `colors.card` and rung 1 are 1.277:1 apart in teal/dark.
    const { fill, colors } = paint(mode, () => <ContentPanel framed>{group()}</ContentPanel>);
    expect(fill).not.toBe(colors.card);
    expect(contrastRatio(fill, colors.card)).toBeGreaterThanOrEqual(FILL_JND);
  });

  it('follows the FILL when a panel publishes a rung that is not its colour', () => {
    // The discriminator between "read the rung" and "read the fill", and the
    // only rendered case where they disagree: a `ContentPanel` repainted as the
    // page still publishes level 1, so the RUNG says "you are on a card" while
    // the panel is painting `background`. Reading the rung answered
    // `backgroundSecondary`, which measures 1.121-1.132 against that page in dark
    // — a group drawn on the page in the one colour that nearly matches it.
    const { fill, colors } = paint(mode, () => (
      <ContentPanel
        framed
        surfaceClassName="bg-background"
        surfaceColor={theme.colors.background}
      >
        {group()}
      </ContentPanel>
    ));
    expect(fill).toBe(colors.card);
  });

  it('lets an explicit variant win over the ambient surface, in both directions', () => {
    const insidePanel = paint(mode, () => <ContentPanel framed>{group('plain')}</ContentPanel>);
    expect(insidePanel.fill).toBe(insidePanel.colors.card);

    const onThePage = paint(mode, () => group('filled'));
    expect(onThePage.fill).toBe(onThePage.colors.backgroundSecondary);
  });
});

/**
 * Rendered groups must separate from the actual menu fill in both modes. The
 * tonal policy improved teal's old fixed-token negative control; mono remains
 * a failing dark case, pinned alongside purple in surface-level-adoption.
 */
describe.each(MODES)('a group on the menu surface separates from it (%s)', (mode) => {
  const theme = buildTheme('teal', mode);
  const menuSurface = resolveSurfaceLevel(theme, 1).background;

  it('clears the just-noticeable floor against what the menu actually paints', () => {
    const { fill } = paint(mode, () => (
      // What `FloatingPanel` and `QueuePanel` publish: the rung, no exact fill.
      <SurfaceLevelProvider level={1}>{group()}</SurfaceLevelProvider>
    ));
    expect(contrastRatio(fill, menuSurface)).toBeGreaterThanOrEqual(FILL_JND);
  });

  it('and `backgroundSecondary` — the answer this replaced — would not, in dark', () => {
    const negativeTheme = buildTheme('mono', mode);
    const negativeMenu = resolveSurfaceLevel(negativeTheme, 1).background;
    const measured = contrastRatio(negativeTheme.colors.backgroundSecondary, negativeMenu);
    if (mode === 'dark') expect(measured).toBeLessThan(FILL_JND);
    else expect(measured).toBeGreaterThanOrEqual(FILL_JND);
  });
});

describe.each(MODES)('a surface that starts a new painting context resets it (%s)', (mode) => {
  it('OverlayRoot resets the surface a ContentPanel published', () => {
    const { fill, colors } = paint(mode, () => (
      <ContentPanel framed>
        <OverlayRoot>{group()}</OverlayRoot>
      </ContentPanel>
    ));
    // The plain overlay body is the page rung, so the group is a card again.
    expect(fill).toBe(colors.card);
  });

  it('a BottomSheet resets it too — native sheets never pass through OverlayRoot', () => {
    const { fill, colors } = paint(mode, () => (
      <ContentPanel framed>
        <BottomSheet open>{group()}</BottomSheet>
      </ContentPanel>
    ));
    expect(fill).toBe(colors.card);
  });

  it('an open Dialog paints the same whether or not its trigger lives in a panel', () => {
    const inPanel = paint(mode, () => (
      <ContentPanel framed>
        <Dialog open onClose={() => {}}>
          {group()}
        </Dialog>
      </ContentPanel>
    ));
    const onPage = paint(mode, () => (
      <Dialog open onClose={() => {}}>
        {group()}
      </Dialog>
    ));

    // The property, stated directly: same dialog, same paint, either origin.
    expect(inPanel.fill).toBe(inPanel.colors.card);
    expect(onPage.fill).toBe(onPage.colors.card);
  });

  it('but content still inside the panel, beside the overlay, keeps the panel surface', () => {
    // The reset is scoped to the overlay, not to the whole subtree under it —
    // otherwise it would "fix" the dialog by breaking the screen behind it.
    const { fill, colors } = paint(mode, () => (
      <ContentPanel framed>
        <OverlayRoot>
          <Text>overlay</Text>
        </OverlayRoot>
        {group()}
      </ContentPanel>
    ));
    expect(fill).not.toBe(colors.card);
    expect(contrastRatio(fill, colors.card)).toBeGreaterThanOrEqual(FILL_JND);
  });
});

describe.each(MODES)('both ContentPanel forks publish their fill (%s)', (mode) => {
  // A platform fork is two files, and jest resolves the bare specifier to the
  // NATIVE one (no haste/platform config — see `AGENTS.md`), so every test above
  // measures `ContentPanel.tsx` alone. The web fork is named here so it cannot
  // quietly stop publishing while the suite stays green on the other file.
  it('web: a group inside the panel steps off the panel with no prop', () => {
    const { fill, colors } = paint(mode, () => <ContentPanelWeb framed>{group()}</ContentPanelWeb>);
    expect(fill).not.toBe(colors.card);
    expect(contrastRatio(fill, colors.card)).toBeGreaterThanOrEqual(FILL_JND);
  });
});
