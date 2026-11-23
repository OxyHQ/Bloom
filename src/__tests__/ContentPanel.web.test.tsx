import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import { resolveSurfaceFill } from '../surface/shared';
import type React from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PANEL_SHADOW } from '../styles/panel-chrome';
import { ContentPanel } from '../content-panel/ContentPanel.web';
import { findHost, resolvedStyle } from './support/rendered-style';

/**
 * `overlaySizing` is WEB-only, so it must be exercised against `ContentPanel.web`
 * directly — the bare `../content-panel` specifier resolves to the native
 * variant under jest (no haste/platform config; see `AGENTS.md`), which is
 * exactly what `ContentPanelNesting.test.tsx` already relies on for the native
 * side. The test window is 375 wide, below every framing breakpoint.
 */
function renderPanel(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function styleOf(tree: unknown, testID: string): Record<string, unknown> {
  const host = findHost(tree, testID);
  if (!host) throw new Error(`no host rendered for testID "${testID}"`);
  return resolvedStyle(host.props.style);
}

describe('ContentPanel.web overlaySizing default (viewport)', () => {
  it('pins a screen-tall frame when overlaySizing is omitted, so the panel occupies the window while its content moves', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = styleOf(tree, 'content-panel-bleed-mask');
    expect(mask.position).toBe('sticky');
    expect(mask.height).toBe('calc(100dvh - 16px)');
    expect(mask.gridArea).toBeUndefined();
    expect(styleOf(tree, 'content-panel-border-frame').position).toBe('sticky');
  });
});

describe('ContentPanel.web overlaySizing="panel"', () => {
  it('turns the surface into a single-cell CSS grid instead of using viewport math', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(styleOf(toJSON(), 'content-panel-surface')).toMatchObject({
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr)',
      gridTemplateRows: 'minmax(0,1fr)',
    });
  });

  it('places the border and rounded content in the same grid cell without a page-colored mask', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    for (const id of ['content-panel-border-frame', 'content-panel-content']) {
      const style = styleOf(tree, id);
      expect(style.gridArea).toBe('1/1');
      expect(style.position).not.toBe('sticky');
    }
    expect(findHost(tree, 'content-panel-bleed-mask')).toBeNull();
  });

  it('still hides the overlays below the responsive framedFrom breakpoint', () => {
    const { toJSON } = renderPanel(
      <ContentPanel overlaySizing="panel" framedFrom={640}>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(styleOf(toJSON(), 'content-panel-border-frame').display).toBe('none');
  });

  it('never hides the overlays when framed is always-on (true), panel mode included', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" framedFrom={640}>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(styleOf(toJSON(), 'content-panel-border-frame').display).toBeUndefined();
  });

  it('clips actual bounded content, leaving rounded corners transparent over neighboring panels', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    expect(findHost(tree, 'content-panel-bleed-mask')).toBeNull();
    expect(styleOf(tree, 'content-panel-content').overflow).toBe('clip');
    expect(styleOf(tree, 'content-panel-border-frame')).toMatchObject({
      borderWidth: 1,
      borderColor: 'transparent',
    });
  });

  it('selects the viewport mask rule, which covers the declared insets', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="viewport">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(findHost(toJSON(), 'content-panel-bleed-mask')?.props.dataSet).toMatchObject({
      bloomPanelMask: 'viewport',
    });
  });

  it('still respects showStickyFrame={false} to omit only the border overlay', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" showStickyFrame={false}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    expect(findHost(tree, 'content-panel-border-frame')).toBeNull();
    expect(findHost(tree, 'content-panel-bleed-mask')).toBeNull();
  });
});

describe('ContentPanel.web fill', () => {
  it('clamps both boxes so the panel can be the height it was given, and makes the CONTENT the scroller', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed fill>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const surface = styleOf(tree, 'content-panel-surface');
    const content = styleOf(tree, 'content-panel-content');
    // `minHeight: 0` on both: a flex child's automatic minimum size is its content,
    // so without it the panel grows past the box it was told to fit.
    expect(surface.minHeight).toBe(0);
    expect(content.minHeight).toBe(0);
    // The overflow goes on the content, never the surface — the surface is what
    // the frame and mask are drawn to, and a scrolling surface takes the edge
    // with it.
    expect(content.overflowY).toBe('auto');
    expect(surface.overflowY).toBeUndefined();
  });

  it('is off by default — the panel grows with its content', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    expect(styleOf(tree, 'content-panel-surface').minHeight).toBeUndefined();
    expect(styleOf(tree, 'content-panel-content').overflowY).toBeUndefined();
  });
});

describe('ContentPanel.web overlayInset', () => {
  it('pins the frame at the inset it is given, top and bottom, so it starts where the panel really starts', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlayInset={16}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = resolvedStyle(findHost(tree, 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBe(16);
    expect(mask.height).toBe('calc(100dvh - 32px)');
    expect(mask.marginBottom).toBe('calc(-100dvh + 32px)');
    expect(resolvedStyle(findHost(tree, 'content-panel-border-frame')?.props.style).top).toBe(16);
  });

  it('takes a PAIR when chrome above the panel shifts where it visually starts', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlayInset={{ top: 72, bottom: 8 }}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBe(72);
    expect(mask.boxShadow).toContain('0 0 0 72px');
    const surface = resolvedStyle(findHost(toJSON(), 'content-panel-surface')?.props.style);
    expect(surface['--bloom-panel-inset-top']).toBe('72px');
    expect(mask.height).toBe('calc(100dvh - 80px)');
  });

  it('keeps the default 8 inset', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlayInset={8}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBe(8);
    expect(mask.height).toBe('calc(100dvh - 16px)');
  });

  it("is a no-op in panel mode — that mode already starts at the panel's own box", () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" overlayInset={64}>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(findHost(toJSON(), 'content-panel-bleed-mask')).toBeNull();
  });
});

describe('chrome', () => {
  it('elevated (the default) puts the panel shadow on the same element as the hairline', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const frame = findHost(toJSON(), 'content-panel-border-frame');
    expect(styleOf(toJSON(), 'content-panel-border-frame').borderColor).toBe('transparent');
    expect(resolvedStyle(frame?.props.style).boxShadow).toBe(PANEL_SHADOW.light);
  });

  it('border keeps the hairline and drops the shadow; none drops the frame entirely', () => {
    const bordered = renderPanel(
      <ContentPanel framed chrome="border">
        <Text>content</Text>
      </ContentPanel>,
    );
    const frame = findHost(bordered.toJSON(), 'content-panel-border-frame');
    expect(frame).not.toBeNull();
    expect(resolvedStyle(frame?.props.style).boxShadow).toBeUndefined();

    const bare = renderPanel(
      <ContentPanel framed chrome="none">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(findHost(bare.toJSON(), 'content-panel-border-frame')).toBeNull();
  });

  it('takes a shadow override', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed shadow="0 0 0 2px red">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(
      resolvedStyle(findHost(toJSON(), 'content-panel-border-frame')?.props.style).boxShadow,
    ).toBe('0 0 0 2px red');
  });
});

afterEach(() => jest.restoreAllMocks());

it.each([
  ['#80A0C0', 'rgba(128, 160, 192, 0.72)'],
  ['rgba(128, 160, 192, 0.4)', 'rgba(128, 160, 192, 0.4)'],
])('delegates %s to paint and publishes the matching body fill', (background, painted) => {
  // The web material: an opaque fill transmits a tenth through the backdrop blur.
  jest.replaceProperty(Platform, 'OS', 'web');
  let fill = '';
  function Probe() {
    fill = useSurfaceFill();
    return null;
  }
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <SurfaceLevelProvider level={2} fill="#203040">
        <ContentPanel framed surfaceStyle={{ backgroundColor: background }}>
          <Probe />
        </ContentPanel>
      </SurfaceLevelProvider>
    </BloomThemeProvider>,
  );
  const host = resolvedStyle(findHost(view.toJSON(), 'content-panel-surface')?.props.style);
  expect(host.backgroundColor).toBe('transparent');
  expect(host['--bloom-surface-fill']).toBe(painted);
  expect(fill).toBe(resolveSurfaceFill(painted, '#203040'));
});
