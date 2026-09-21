import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PANEL_SHADOW } from '../styles/panel-chrome';
import { ContentPanel } from '../content-panel/ContentPanel.web';
import { classNamesOn, findHost, resolvedStyle } from './support/rendered-style';

/**
 * `overlaySizing` is WEB-only, so it must be exercised against `ContentPanel.web`
 * directly — the bare `../content-panel` specifier resolves to the native
 * variant under jest (no haste/platform config; see `AGENTS.md`), which is
 * exactly what `ContentPanelNesting.test.tsx` already relies on for the native
 * side. Same rendering/assertion approach as that suite (`classNamesOn` reads
 * the `{ $$css, className }` descriptor react-native-css merges into `style`)
 * so this stays consistent with how every other web-fork suite in this repo
 * reads a resolved class list.
 */
function renderPanel(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
}

// `classNamesOn` returns one array entry per `$$css` descriptor merged into
// `style` (i.e. per class-string layer), not one per individual class token —
// joined into a single string here, exactly like `ContentPanelNesting.test.tsx`'s
// own `surfaceClassName` helper, so `.toContain(token)` does a substring check
// rather than an exact-array-element one.
function classesFor(tree: unknown, testID: string): string {
  const host = findHost(tree, testID);
  if (!host) throw new Error(`no host rendered for testID "${testID}"`);
  return classNamesOn(host.props.style).join(' ');
}

describe('ContentPanel.web overlaySizing default (viewport)', () => {
  it('pins a screen-tall frame when overlaySizing is omitted, so the panel occupies the window while its content moves', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = classesFor(tree, 'content-panel-bleed-mask');
    expect(mask).toContain('web:sticky');
    expect(mask).toContain('h-[calc(100dvh-16px)]');
    expect(mask).not.toContain('web:[grid-area:1/1]');
    expect(classesFor(tree, 'content-panel-border-frame')).toContain('web:sticky');
  });
});

describe('ContentPanel.web overlaySizing="panel"', () => {
  it('turns the surface into a single-cell CSS grid instead of using viewport math', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    const surface = classesFor(toJSON(), 'content-panel-surface');
    expect(surface).toContain('web:grid');
    expect(surface).toContain('web:[grid-template-columns:minmax(0,1fr)]');
    expect(surface).toContain('web:[grid-template-rows:minmax(0,1fr)]');
  });

  it('places the bleed-mask, border-frame and content wrapper in the same grid cell, sized to the panel', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    for (const id of ['content-panel-bleed-mask', 'content-panel-border-frame', 'content-panel-content']) {
      const classes = classesFor(tree, id);
      expect(classes).toContain('web:[grid-area:1/1]');
      expect(classes).not.toContain('web:sticky');
    }
    const mask = classesFor(tree, 'content-panel-bleed-mask');
    expect(mask).toContain('h-full');
    expect(mask).not.toContain('h-[calc(100dvh-16px)]');
    expect(mask).not.toContain('margin-bottom:calc(-100dvh');
  });

  it('still hides the overlays below the responsive framedFrom breakpoint', () => {
    const { toJSON } = renderPanel(
      <ContentPanel overlaySizing="panel" framedFrom={640}>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(classesFor(toJSON(), 'content-panel-bleed-mask')).toContain('max-sm:hidden');
  });

  it('never hides the overlays when framed is always-on (true), panel mode included', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" framedFrom={640}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = classesFor(toJSON(), 'content-panel-bleed-mask');
    expect(mask).not.toContain('hidden');
  });

  it('clips the bleed-mask shadow flush to the box in panel mode (no escape bleed onto a close sibling)', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel">
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = classesFor(tree, 'content-panel-bleed-mask');
    expect(mask).toContain('web:[clip-path:inset(0)]');
    expect(mask).not.toContain('web:[clip-path:inset(-12px)]');
    const border = classesFor(tree, 'content-panel-border-frame');
    expect(border).toContain('border');
    expect(border).toContain('border-border');
  });

  it('selects the viewport mask rule, which covers the declared insets', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="viewport">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(findHost(toJSON(), 'content-panel-bleed-mask')?.props.dataSet).toMatchObject({ bloomPanelMask: 'viewport' });
  });

  it('still respects showStickyFrame={false} to omit only the border overlay', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" showStickyFrame={false}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    expect(findHost(tree, 'content-panel-border-frame')).toBeNull();
    expect(findHost(tree, 'content-panel-bleed-mask')).not.toBeNull();
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
    const surface = classesFor(tree, 'content-panel-surface');
    const content = classesFor(tree, 'content-panel-content');
    // `min-h-0` on both: a flex child's automatic minimum size is its content,
    // so without it the panel grows past the box it was told to fit.
    expect(surface).toContain('min-h-0');
    expect(content).toContain('min-h-0');
    // The overflow goes on the content, never the surface — the surface is what
    // the frame and mask are drawn to, and a scrolling surface takes the edge
    // with it.
    expect(content).toContain('web:[overflow-y:auto]');
    expect(surface).not.toContain('overflow-y');
  });

  it('is off by default — the panel grows with its content', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    expect(classesFor(tree, 'content-panel-surface')).not.toContain('min-h-0');
    expect(classesFor(tree, 'content-panel-content')).not.toContain('web:[overflow-y:auto]');
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

  it('is a no-op at the default 8 — the className values stand alone', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlayInset={8}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBeUndefined();
    expect(mask.height).toBeUndefined();
  });

  it('is a no-op in panel mode — that mode already starts at the panel\'s own box', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" overlayInset={64}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBeUndefined();
    expect(mask.height).toBeUndefined();
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
    expect(classesFor(toJSON(), 'content-panel-border-frame')).toContain('border-border');
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
    expect(resolvedStyle(findHost(toJSON(), 'content-panel-border-frame')?.props.style).boxShadow).toBe('0 0 0 2px red');
  });
});
