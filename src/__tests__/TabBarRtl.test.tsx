import React from 'react';
import * as ReactNative from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { act, fireEvent, render } from '@testing-library/react-native';

import { TabBar, TabBarButton } from '../tab-bar';
import { MAX_EXPANDED_ITEM_WIDTH, ROW_PAD_H } from '../tab-bar/shared';
import type { TabBarItem } from '../tab-bar/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * The tab bar under right-to-left layout — `BottomBar`'s navigation is this bar.
 *
 * The tabs are a flex row, so they mirror on their own: the FIRST tab sits at the
 * right edge. Two things do not follow, and both are pinned here:
 *
 *   - the highlight capsule is a `translateX` from its start inset, so its sign
 *     flips — without that it slides off the bar's left side toward nothing;
 *   - the scrub/tap worklets read a PHYSICAL `event.x`, so a touch near the right
 *     edge must resolve to the first tab, not the last.
 *
 * Recording gesture mock for the same reason as `TabBarLongPress.test.tsx`: the
 * shared one discards the worklets this needs to call.
 */

interface MockGesture {
  kind: string;
  end?: (event: { x: number }, success: boolean) => void;
  members: MockGesture[];
  [builder: string]: unknown;
}

const mockGestures: MockGesture[] = [];

jest.mock('react-native-gesture-handler', () => {
  const build = (kind: string): MockGesture => {
    const gesture: MockGesture = { kind, members: [] };
    for (const name of ['activeOffsetX', 'failOffsetY', 'maxDistance', 'maxDuration', 'minDuration', 'onStart', 'onUpdate', 'onFinalize']) {
      gesture[name] = () => gesture;
    }
    gesture.onEnd = (worklet: MockGesture['end']) => {
      gesture.end = worklet;
      return gesture;
    };
    mockGestures.push(gesture);
    return gesture;
  };
  return {
    Gesture: {
      Pan: () => build('Pan'),
      Tap: () => build('Tap'),
      LongPress: () => build('LongPress'),
      Race: (...members: MockGesture[]) => {
        const race = build('Race');
        race.members.push(...members);
        return race;
      },
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  };
});

const i18n = ReactNative.I18nManager as { isRTL: boolean };
const HIGHLIGHT = 'rgb(9 9 9)';
const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
  { name: 'you', label: 'You', icon: null },
];
const BAR_WIDTH = ITEMS.length * MAX_EXPANDED_ITEM_WIDTH + ROW_PAD_H * 2;

afterEach(() => {
  i18n.isRTL = false;
  mockGestures.length = 0;
});

function Bar({ activeIndex, onIndexChange }: { activeIndex: number; onIndexChange?: (index: number) => void }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <TabBar activeIndex={activeIndex} onIndexChange={onIndexChange} theme={{ highlight: HIGHLIGHT }}>
        {ITEMS.map((item, index) => <TabBarButton key={item.name} item={item} index={index} />)}
      </TabBar>
    </BloomThemeProvider>
  );
}

function mount(activeIndex: number, onIndexChange?: (index: number) => void) {
  const utils = render(<Bar activeIndex={activeIndex} onIndexChange={onIndexChange} />);
  const host = utils.UNSAFE_root.findAll(node => typeof node.type === 'string' && typeof node.props.onLayout === 'function')[0];
  if (host) fireEvent(host, 'layout', { nativeEvent: { layout: { width: 375, height: 58, x: 0, y: 0 } } });
  // Mappers run in render under the mock: one more pass reads the settled values.
  utils.rerender(<Bar activeIndex={activeIndex} onIndexChange={onIndexChange} />);
  return utils;
}

function flatten(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

function highlight(root: ReactTestInstance): Record<string, unknown> {
  const found = root
    .findAll(node => typeof node.type === 'string')
    .map(node => flatten(node.props.style))
    .filter(style => style.backgroundColor === HIGHLIGHT);
  if (found.length !== 1) throw new Error(`Expected one highlight, found ${found.length}`);
  return found[0]!;
}

function translateX(style: Record<string, unknown>): number {
  const entry = (style.transform as Array<Record<string, number>>).find(item => 'translateX' in item);
  return entry!.translateX!;
}

function tapAt(x: number) {
  const race = mockGestures.filter(gesture => gesture.kind === 'Race').pop();
  const tap = race?.members.find(gesture => gesture.kind === 'Tap');
  act(() => tap!.end!({ x }, true));
}

describe('TabBar right-to-left', () => {
  it.each([false, true])('rtl=%s: the capsule is anchored at the START edge and slides away from it', rtl => {
    i18n.isRTL = rtl;
    const screen = mount(2);
    const capsule = highlight(screen.UNSAFE_root);
    expect(capsule.insetInlineStart).toBe(0);
    expect(capsule.left).toBeUndefined();
    const distance = ROW_PAD_H + MAX_EXPANDED_ITEM_WIDTH * 2;
    expect(translateX(capsule)).toBe(rtl ? -distance : distance);
  });

  it.each([
    [false, [0, 1, 2]],
    [true, [2, 1, 0]],
  ])('rtl=%s: a touch resolves to the tab under the finger', (rtl, expected) => {
    i18n.isRTL = rtl;
    const onIndexChange = jest.fn();
    mount(0, onIndexChange);
    // Physical left edge, centre, right edge.
    for (const x of [8, BAR_WIDTH / 2, BAR_WIDTH - 8]) tapAt(x);
    expect(onIndexChange.mock.calls.map(call => call[0])).toEqual(expected);
  });
});
