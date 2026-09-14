import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
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
  it('keeps the sticky/100dvh overlay sizing when overlaySizing is omitted', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = classesFor(tree, 'content-panel-bleed-mask');
    expect(mask).toContain('web:sticky');
    expect(mask).toContain('h-[calc(100dvh-16px)]');
    expect(mask).not.toContain('web:grid');
    expect(classesFor(tree, 'content-panel-surface')).not.toContain('web:grid');
  });

  it('keeps sticky sizing even when overlaySizing="viewport" is passed explicitly', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="viewport">
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(classesFor(toJSON(), 'content-panel-border-frame')).toContain('web:sticky');
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

  it('keeps the deliberate 12px bleed halo in the default viewport mode', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(classesFor(toJSON(), 'content-panel-bleed-mask')).toContain('web:[clip-path:inset(-12px)]');
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

describe('ContentPanel.web overlayTopOffset', () => {
  it('shifts the default viewport-mode overlays down by the offset, shrinking height and margin to match', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlayTopOffset={64}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const tree = toJSON();
    const mask = resolvedStyle(findHost(tree, 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBe(72); // 8 + 64
    expect(mask.height).toBe('calc(100dvh - 80px)'); // 16 + 64
    expect(mask.marginBottom).toBe('calc(-100dvh + 80px)');
    const border = resolvedStyle(findHost(tree, 'content-panel-border-frame')?.props.style);
    expect(border.top).toBe(72);
  });

  it('is a no-op when unset — the className-driven base values stand alone', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBeUndefined();
    expect(mask.height).toBeUndefined();
  });

  it('is a no-op in panel mode — that mode already starts at the panel\'s own box', () => {
    const { toJSON } = renderPanel(
      <ContentPanel framed overlaySizing="panel" overlayTopOffset={64}>
        <Text>content</Text>
      </ContentPanel>,
    );
    const mask = resolvedStyle(findHost(toJSON(), 'content-panel-bleed-mask')?.props.style);
    expect(mask.top).toBeUndefined();
    expect(mask.height).toBeUndefined();
  });
});
