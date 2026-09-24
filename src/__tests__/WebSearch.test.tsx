import React from 'react';
import { Linking, Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { resolveButtonRamps } from '../button/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { WebSearch } from '../web-search';
import type { WebSearchStep } from '../web-search';
import { resolveWebSearchPalette } from '../web-search/WebSearch';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../styles/adopt-style-sheet', () => ({ adoptStyleSheet: jest.fn(), dropStyleSheet: jest.fn() }));

const SOURCES = [
  { title: 'PC Gamer', domain: 'www.pcgamer.com', href: 'https://www.pcgamer.com' },
  { title: 'RTINGS', domain: 'www.rtings.com' },
  { title: 'The Verge', domain: 'www.theverge.com' },
  { title: 'Reddit', domain: 'www.reddit.com', brand: 'reddit' as const },
  { title: 'GitHub', domain: 'github.com', brand: 'github' as const },
  { title: "Tom's Hardware", domain: 'www.tomshardware.com' },
  { title: 'Wired', domain: 'www.wired.com' },
];

const STEPS: WebSearchStep[] = [
  { label: 'Researching keyboards', heading: true },
  { label: 'Searched the web for', query: 'budget keyboard', meta: '10 results', sources: SOURCES },
  { label: 'Searched X for', brand: 'x', query: 'aula f75' },
  { label: 'Read', dwell: 1600 },
];

function renderSearch(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const hidden = { includeHiddenElements: true } as const;

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe('WebSearch', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses canonical roles in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme('teal', mode);
      expect(resolveWebSearchPalette(theme)).toMatchObject({
        textSecondary: theme.colors.textSecondary,
        textTertiary: theme.colors.textTertiary,
        iconQuaternary: theme.colors.textTertiary,
        markBorder: theme.colors.borderLight,
        markSurface: theme.colors.card,
        markDot: theme.colors.textTertiary,
        rowHover: theme.colors.backgroundSecondary,
        ring: theme.colors.primary,
      });
    }
  });

  it('paces units: heading, step, its sources a 900ms beat later, then each dwell; Working trails until done', () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();
    const { queryByTestId, getByTestId } = renderSearch(
      <WebSearch testID="ws" steps={STEPS} onComplete={onComplete} reduce />,
    );
    expect(queryByTestId('ws-heading')).toBeNull();
    advance(320);
    expect(getByTestId('ws-heading', hidden)).toBeTruthy();
    expect(getByTestId('ws-working', hidden)).toBeTruthy();
    advance(850);
    expect(getByTestId('ws-step-1', hidden)).toBeTruthy();
    expect(queryByTestId('ws-step-1-sources')).toBeNull();
    advance(899);
    expect(queryByTestId('ws-step-1-sources')).toBeNull();
    advance(1);
    expect(getByTestId('ws-step-1-sources', hidden)).toBeTruthy();
    advance(850);
    expect(getByTestId('ws-step-2', hidden)).toBeTruthy();
    advance(850);
    expect(getByTestId('ws-step-3', hidden)).toBeTruthy();
    // The last step holds for its own dwell (the extra tick) before the log ends.
    advance(1599);
    expect(onComplete).not.toHaveBeenCalled();
    expect(getByTestId('ws-working', hidden)).toBeTruthy();
    advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(queryByTestId('ws-working')).toBeNull();
  });

  it('counts a step with sources as two units when controlled', () => {
    const { getByTestId, queryByTestId, rerender } = renderSearch(
      <WebSearch testID="ws" steps={STEPS} revealed={2} reduce />,
    );
    expect(getByTestId('ws-step-1', hidden)).toBeTruthy();
    expect(queryByTestId('ws-step-1-sources')).toBeNull();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <WebSearch testID="ws" steps={STEPS} revealed={3} reduce />
      </BloomThemeProvider>,
    );
    expect(getByTestId('ws-step-1-sources', hidden)).toBeTruthy();
    expect(queryByTestId('ws-step-2')).toBeNull();
  });

  it('shimmers only the newest step while running, and nothing under reduced motion', () => {
    const shimmering = (root: ReactTestInstance) =>
      root.findAll((node) => String(node.type) === 'Text' && node.props.dataSet?.bloomAgentLogShimmer !== undefined);
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    try {
      const running = renderSearch(<WebSearch testID="ws" steps={STEPS} revealed={4} reduce={false} />);
      const found = shimmering(running.getByTestId('ws', hidden));
      expect(found).toHaveLength(1);
      expect(found[0]!.props.children).toBe('Searched X for');
      running.unmount();
      const reduced = renderSearch(<WebSearch testID="ws" steps={STEPS} revealed={4} reduce />);
      expect(shimmering(reduced.getByTestId('ws', hidden))).toHaveLength(0);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });

  it('insets steps 14 (the log default is 16) and nests sources 7 under the glyph', () => {
    const { getByTestId } = renderSearch(<WebSearch testID="ws" steps={STEPS} revealed={99} reduce />);
    const step = getByTestId('ws-step-1', hidden);
    expect(resolvedStyle((step.children[0] as ReactTestInstance).props.style).paddingLeft).toBe(14);
    const bridge = getByTestId('ws-step-1', hidden).findAll(
      (node) => node.props.testID === 'agent-log-guide-bridge' && typeof node.type === 'string',
    )[0]!;
    expect(resolvedStyle(bridge.props.style)).toMatchObject({ height: 5, top: -5, left: 7 });
  });

  it('stacks up to six marks (20px, 1px ring by longhand, 6px overlap) and counts the rest', () => {
    const { getByTestId, getByText } = renderSearch(<WebSearch testID="ws" steps={STEPS} revealed={99} reduce />);
    const stack = getByTestId('ws-step-1-sources-stack', hidden);
    const marks = stack.findAll(
      (node) => typeof node.type === 'string' && resolvedStyle(node.props.style).width === 20 && resolvedStyle(node.props.style).borderTopWidth === 1,
    );
    expect(marks).toHaveLength(6);
    const mark = resolvedStyle(marks[0]!.props.style);
    expect(mark).toMatchObject({ height: 20, borderRadius: 10, borderLeftWidth: 1 });
    expect(mark.borderWidth).toBeUndefined();
    expect(getByText('+1', hidden)).toBeTruthy();
  });

  it('paints brand marks in their colour, near-black brands in the text colour', () => {
    const theme = buildTheme('teal', 'dark');
    const { getByTestId } = renderSearch(
      <WebSearch
        testID="ws"
        revealed={99}
        reduce
        steps={[
          { label: 'x', brand: 'x' },
          { label: 'reddit', brand: 'reddit' },
          { label: 'google', brand: 'google' },
        ]}
      />,
      'dark',
    );
    const fillOf = (index: number) =>
      getByTestId(`ws-step-${index}`, hidden).findAll((node) => node.props.d !== undefined && node.props.fill !== undefined)[0]!
        .props.fill;
    expect(fillOf(0)).toBe(theme.colors.text);
    expect(fillOf(1)).toBe('#FF4500');
    expect(fillOf(2)).toBe(resolveButtonRamps(theme).accent[500]);
  });

  it("draws a source's favicon, lets a brand mark win over it, and falls back to the dot when it fails", () => {
    const { getByTestId } = renderSearch(
      <WebSearch
        testID="ws"
        revealed={99}
        reduce
        steps={[{
          label: 'Searched the web for',
          sources: [
            { title: 'GSMArena', domain: 'www.gsmarena.com', faviconUrl: 'https://api.clarity.surf/favicons/www.gsmarena.com' },
            { title: 'Reddit', domain: 'www.reddit.com', brand: 'reddit', faviconUrl: 'https://api.clarity.surf/favicons/www.reddit.com' },
          ],
        }]}
      />,
    );
    const stack = getByTestId('ws-step-0-sources-stack', hidden);
    const images = () => stack.findAll((node) => typeof node.type === 'string' && node.props.source?.uri !== undefined && typeof node.props.onError === 'function');
    expect(images().map((node) => node.props.source.uri)).toEqual(['https://api.clarity.surf/favicons/www.gsmarena.com']);
    expect(resolvedStyle(images()[0]!.props.style)).toMatchObject({ width: 12, height: 12 });

    act(() => images()[0]!.props.onError({ nativeEvent: { error: 'HTTP 404' } }));
    expect(images()).toHaveLength(0);
  });

  it('opens sources bottom-up one row per 100ms, then closes them again', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = renderSearch(
      <WebSearch testID="ws" steps={STEPS} revealed={99} reduce={false} />,
    );
    const toggle = getByTestId('ws-step-1-sources-toggle', hidden);
    expect(toggle.props['aria-expanded']).toBe(false);
    const stackCount = () =>
      getByTestId('ws-step-1-sources-stack', hidden).findAll(
        (node) => typeof node.type === 'string' && resolvedStyle(node.props.style).borderTopWidth === 1,
      ).length;

    pressHost(toggle);
    expect(getByTestId('ws-step-1-sources-toggle', hidden).props['aria-expanded']).toBe(true);
    expect(getByTestId('ws-step-1-sources-toggle', hidden).props.accessibilityState).toEqual({ expanded: true });
    advance(100);
    // The 7th source (past the stack) opens first; the count goes with it.
    expect(stackCount()).toBe(6);
    expect(queryByText('+1')).toBeNull();
    // A flying mark is measured before it moves; the mocked native `measureLayout`
    // never answers, so each flight waits out the 48ms fallback here.
    advance(148);
    expect(stackCount()).toBe(5);
    for (let i = 0; i < 5; i++) advance(148);
    expect(stackCount()).toBe(0);

    pressHost(getByTestId('ws-step-1-sources-toggle', hidden));
    advance(148);
    // Closing walks back down: the top row returns to the stack first.
    expect(stackCount()).toBe(1);
    for (let i = 0; i < 6; i++) advance(148);
    expect(stackCount()).toBe(6);
    expect(queryByText('+1', hidden)).toBeTruthy();
  });

  it('a source with href is a link; on native pressing it opens the URL', () => {
    jest.useFakeTimers();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = renderSearch(<WebSearch testID="ws" steps={STEPS} revealed={99} reduce />);
    const row = getByTestId('ws-step-1-sources-link-0', hidden);
    const link = row.findAll((node) => typeof node.type === 'string' && node.props.role === 'link')[0]!;
    expect(link.props.accessibilityLabel).toBe('PC Gamer, www.pcgamer.com');
    pressHost(link);
    expect(open).toHaveBeenCalledWith('https://www.pcgamer.com');
    // No href: not pressable.
    expect(
      getByTestId('ws-step-1-sources-link-1', hidden).findAll((node) => node.props.role === 'link'),
    ).toHaveLength(0);
    open.mockRestore();
  });

  it('without a heading, Working sits on the glyph edge (14)', () => {
    const { getByTestId } = renderSearch(
      <WebSearch testID="ws" steps={STEPS.slice(1)} revealed={1} reduce working="Reading" />,
    );
    const working = getByTestId('ws-working', hidden);
    expect(resolvedStyle((working.children[0] as ReactTestInstance).props.style).paddingLeft).toBe(14);
  });
});
