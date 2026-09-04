import React from 'react';
import { render } from '@testing-library/react-native';
import type { ReactTestRendererJSON, ReactTestRendererNode } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import { windowEdgeGap } from '../layout/edge';
import { BLUR_BLEED, EXPANDED_HEIGHT } from '../tab-bar/shared';
import type { TabBarItem, TabBarProps } from '../tab-bar/types';

/**
 * `blur` — turning the bar's bottom band off, and tuning it.
 *
 * The band is full-bleed and 114pt tall at a zero bottom inset (the bar's own
 * bottom gap + its expanded height + the bleed above it), so ANY chrome a screen
 * floats near the bottom edge sits inside it and is blurred: a video scrubber, a
 * compose FAB, a QR-scan button. No consumer can escape it from the outside —
 * `zIndex` orders siblings within one stacking context, and a screen's FAB lives
 * inside an earlier sibling of the bar's host — so the prop is the only fix that
 * does not also change where that FAB paints relative to everything else.
 *
 * Asserted end to end through the REAL `TabBar` (jest has no platform-extension
 * resolution, so `../tab-bar` binds the neutral surface and the NATIVE
 * `ProgressiveBlur`, whose ten `BlurView`s are what the `expo-blur` mock
 * renders). That makes these assertions about the shipped composition rather
 * than about a stand-in wired up by the test.
 */

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
  { name: 'you', label: 'You', icon: null },
];

/** Insets are all zero under the safe-area mock, so this is the real 118. */
const BAND_HEIGHT = windowEdgeGap(0) + EXPANDED_HEIGHT + BLUR_BLEED;

/** The fork's own default, applied when nothing overrides it. */
const DEFAULT_INTENSITY = 5;

function renderBar(blur?: TabBarProps['blur']) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <TabBar activeIndex={0} blur={blur}>
        {ITEMS.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} />
        ))}
      </TabBar>
    </BloomThemeProvider>,
  ).toJSON();
}

/** What `toJSON()` hands back — a node, several, or nothing rendered at all. */
type RenderedTree = ReactTestRendererNode | ReactTestRendererNode[] | null;

function isJsonNode(node: ReactTestRendererNode): node is ReactTestRendererJSON {
  return typeof node !== 'string';
}

/** Every HOST node in the rendered tree — composites collapse to what they render. */
function hostNodes(tree: RenderedTree): ReactTestRendererJSON[] {
  if (tree === null) return [];
  const roots = (Array.isArray(tree) ? tree : [tree]).filter(isJsonNode);
  return roots.flatMap((node) => [node, ...hostNodes(node.children ?? [])]);
}

function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.assign(out, value);
  };
  visit(style);
  return out;
}

/**
 * The bar's outermost view — `styles.root`, the absolutely-positioned
 * `box-none` layer the blur and the pill wrap are the two children of.
 *
 * `box-none` is matched on the PROP, not on the flattened style: react-native-web
 * only resolves that RN-only value from the prop path, so this bar (a full-width
 * band pinned to the bottom of every page) would silently swallow clicks if it
 * ever moved back into the style object. See `pointer-events-style-form.test.ts`.
 */
function barRoot(tree: RenderedTree): ReactTestRendererJSON {
  const found = hostNodes(tree).find((node) => {
    const style = flattenStyle(node.props.style);
    return style.position === 'absolute' && node.props.pointerEvents === 'box-none';
  });
  if (!found) throw new Error('The bar rendered no absolute box-none root');
  return found;
}

function children(node: ReactTestRendererJSON): ReactTestRendererJSON[] {
  return (node.children ?? []).filter(isJsonNode);
}

function blurLayers(tree: RenderedTree): ReactTestRendererJSON[] {
  return hostNodes(tree).filter((node) => node.type === 'BlurView');
}

function intensities(tree: RenderedTree): unknown[] {
  return [...new Set(blurLayers(tree).map((layer) => layer.props.intensity))];
}

describe('TabBar blur', () => {
  it('renders the band by default, behind the pill', () => {
    const tree = renderBar();
    expect(blurLayers(tree).length).toBeGreaterThan(0);

    // FIRST child, so it paints behind the pill rather than over it.
    const band = children(barRoot(tree))[0];
    const style = flattenStyle(band?.props.style);
    expect(style.position).toBe('absolute');
    expect(style.bottom).toBe(0);
    // Full-bleed, and tall enough to reach anything a screen floats down here.
    expect(style.left).toBe(0);
    expect(style.right).toBe(0);
    expect(style.height).toBe(BAND_HEIGHT);
    expect(BAND_HEIGHT).toBe(118);
  });

  it('treats blur={true} as exactly the default', () => {
    // The prop defaults to `true`, so an app that never heard of it and one that
    // asks for the blur explicitly must render the identical tree.
    expect(JSON.stringify(renderBar(true))).toBe(JSON.stringify(renderBar()));
  });

  it('renders no blur at all with blur={false}', () => {
    expect(blurLayers(renderBar(false))).toEqual([]);
  });

  it('leaves no empty node behind with blur={false}', () => {
    // Not merely "invisible": an absolutely-positioned 114pt view that renders
    // nothing is still a node, still a rect, and still something to reason about
    // when debugging why a FAB is not reachable.
    expect(children(barRoot(renderBar())).length).toBe(2);
    expect(children(barRoot(renderBar(false))).length).toBe(1);
  });

  it('keeps the bar itself when the blur is off', () => {
    // Guards the obvious over-reach: `false` removes the band, not the pill.
    const tabs = hostNodes(renderBar(false)).filter(
      (node) => node.props.accessibilityRole === 'tab',
    );
    expect(tabs).toHaveLength(ITEMS.length);
  });

  it('tunes the strength with the object form', () => {
    expect(intensities(renderBar({ intensity: 12 }))).toEqual([12]);
  });

  it('keeps the fork default for an object with no intensity', () => {
    // `{}` says "blurred, default strength" — it must not resolve to 0, which
    // would read as "off" while still paying for ten composited layers.
    expect(intensities(renderBar({}))).toEqual([DEFAULT_INTENSITY]);
    expect(intensities(renderBar())).toEqual([DEFAULT_INTENSITY]);
  });
});
