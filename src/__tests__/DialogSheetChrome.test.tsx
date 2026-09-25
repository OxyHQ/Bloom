import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
// The sheet's keyboard tracker, as jest maps it (the package is an optional
// peer and not installed here).
import { useKeyboardHandler } from '../../__mocks__/react-native-keyboard-controller';

import { Dialog, useDialogControl } from '../dialog';
import {
  DIALOG_HEADER_CONTENT_TOP,
  DIALOG_HEADER_INLINE_CONTENT_TOP,
  DIALOG_NAV_BAR_HEIGHT,
  isInlineCloseHeader,
} from '../dialog/DialogHeader';
import type { DialogHeaderConfig } from '../dialog/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';

/**
 * Chrome a bottom-placement Dialog owes its content on a phone, found in Android
 * QA of the Services account sheet (OxyHQ/oxy#1375):
 *
 *  - the bottom safe area: the sheet is flush with a window drawn edge-to-edge,
 *    and its last row sat on the gesture bar with no scroll range to move it off;
 *  - a large-title header whose nav row holds nothing but the ✕ put a 72px empty
 *    band above the title of every entry view.
 */

// Mutated per test; must be `mock`-prefixed for the hoisted factory.
const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => mockInsets,
}));

/** A Pixel 8a navigating by gestures: 63px at 2.625x. */
const GESTURE_BAR_INSET = 24;

const SPACER = 'dialog-sheet-safe-area';

function openDialog(props: Partial<React.ComponentProps<typeof Dialog>>) {
  let control: ReturnType<typeof useDialogControl> | undefined;
  function Harness() {
    control = useDialogControl();
    return (
      <Dialog control={control} placement="bottom" testID="sheet" {...props}>
        <Text>Body</Text>
      </Dialog>
    );
  }
  const draw = () => (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Harness />
    </BloomThemeProvider>
  );
  const utils = render(draw());
  act(() => {
    control?.open();
  });
  /** A render with nothing changed but shared values, which jest's mappers only read on render. */
  const refresh = () => utils.rerender(draw());
  return { ...utils, refresh };
}

afterEach(() => {
  mockInsets.bottom = 0;
});

describe('bottom-placement Dialog keeps its content off the system gesture bar', () => {
  it('ends its content with a spacer the height of the bottom safe area', () => {
    mockInsets.bottom = GESTURE_BAR_INSET;
    const { getByTestId } = openDialog({});
    const content = getByTestId('sheet');
    const spacer = getByTestId(SPACER);
    expect(resolvedStyle(spacer.props.style).height).toBe(GESTURE_BAR_INSET);
    // Inside the content container, AFTER the body — so it extends the scroll
    // range rather than shrinking the sheet, and the body (the morph layer,
    // first child) is still measured on its own.
    // (Compared by testID: a failing `toBe` on test instances pretty-prints a
    // circular tree and never returns.)
    const ids = content.children.map((c) => (typeof c === 'string' ? null : (c.props.testID ?? null)));
    expect(ids.length).toBeGreaterThan(1);
    expect(ids[ids.length - 1]).toBe(SPACER);
  });

  it('leaves the caller’s content padding untouched', () => {
    mockInsets.bottom = GESTURE_BAR_INSET;
    const { getByTestId } = openDialog({ contentPadding: 12 });
    expect(resolvedStyle(getByTestId('sheet').props.style).padding).toBe(12);
  });

  it('applies to a nav-header sheet and a scrollable={false} sheet alike', () => {
    mockInsets.bottom = GESTURE_BAR_INSET;
    const header = openDialog({ header: { title: 'Sign in' } });
    expect(resolvedStyle(header.getByTestId(SPACER).props.style).height).toBe(GESTURE_BAR_INSET);
    header.unmount();

    const bounded = openDialog({ scrollable: false });
    expect(resolvedStyle(bounded.getByTestId(SPACER).props.style).height).toBe(GESTURE_BAR_INSET);
  });

  it('folds the spacer while the keyboard is up, which already covers the gesture bar', () => {
    // Android 16: the sheet rides on the keyboard, and a spacer left standing
    // floated its buttons a gesture bar's height above it.
    mockInsets.bottom = GESTURE_BAR_INSET;
    const { getByTestId, refresh } = openDialog({});
    const calls = (useKeyboardHandler as jest.Mock).mock.calls;
    const handlers = calls[calls.length - 1]?.[0] as {
      onEnd: (event: { height: number }) => void;
    };
    const spacerHeight = () => resolvedStyle(getByTestId(SPACER).props.style).height;
    expect(spacerHeight()).toBe(GESTURE_BAR_INSET);
    act(() => handlers.onEnd({ height: 300 }));
    refresh();
    expect(spacerHeight()).toBe(0);
    act(() => handlers.onEnd({ height: 0 }));
    refresh();
    expect(spacerHeight()).toBe(GESTURE_BAR_INSET);
  });

  it('adds nothing on a device with no bottom inset', () => {
    const { queryByTestId } = openDialog({});
    expect(queryByTestId(SPACER)).toBeNull();
  });
});

describe('a large-title header whose nav row holds only the ✕', () => {
  it('starts the title level with the ✕ instead of below an empty bar', () => {
    const { getByTestId } = openDialog({ header: { title: 'Sign in with Oxy' } });
    expect(resolvedStyle(getByTestId('dialog-large-title-inset').props.style).height).toBe(
      DIALOG_HEADER_INLINE_CONTENT_TOP,
    );
    // The first line (38px) is centred on the 52px nav row.
    expect(DIALOG_HEADER_INLINE_CONTENT_TOP).toBe((DIALOG_NAV_BAR_HEIGHT - 38) / 2);
    expect(DIALOG_HEADER_INLINE_CONTENT_TOP).toBeLessThan(DIALOG_HEADER_CONTENT_TOP);
  });

  it('keeps the bar’s opaque scrim off the title until content scrolls under it', () => {
    const inline = openDialog({ header: { title: 'Sign in with Oxy' } });
    expect(resolvedStyle(inline.getByTestId('dialog-nav-scrim').props.style).opacity).toBe(0);
    inline.unmount();

    const stacked = openDialog({ header: { title: 'Create your account', onBack: () => {} } });
    expect(resolvedStyle(stacked.getByTestId('dialog-nav-scrim').props.style).opacity).toBe(1);
  });

  it('wraps the title before the ✕ it shares the row with', () => {
    const { getAllByText } = openDialog({ header: { title: 'Sign in with Oxy' } });
    const large = getAllByText('Sign in with Oxy').find(
      (node) => resolvedStyle(node.props.style).fontSize === 32,
    );
    expect(resolvedStyle(large?.props.style).marginInlineEnd).toBeGreaterThan(0);
  });

  it('keeps the stacked layout when the bar has a back button', () => {
    const { getByTestId } = openDialog({ header: { title: 'Create your account', onBack: () => {} } });
    expect(resolvedStyle(getByTestId('dialog-large-title-inset').props.style).height).toBe(
      DIALOG_HEADER_CONTENT_TOP,
    );
  });
});

describe('isInlineCloseHeader', () => {
  const Icon = () => null;
  const cases: Array<[string, DialogHeaderConfig, boolean]> = [
    ['title only', { title: 'T' }, true],
    ['title + subtitle', { title: 'T', subtitle: 'S' }, true],
    ['no close at all', { title: 'T', showClose: false }, true],
    ['back button', { title: 'T', onBack: () => {} }, false],
    ['custom left', { title: 'T', left: <Text>L</Text> }, false],
    ['custom right', { title: 'T', right: <Text>R</Text> }, false],
    ['primary action', { title: 'T', primaryAction: { label: 'Save', onPress: () => {} } }, false],
    ['icon actions', { title: 'T', actions: [{ icon: Icon, accessibilityLabel: 'A', onPress: () => {} }] }, false],
    ['branded titleContent', { title: 'T', titleContent: <Text>Logo</Text> }, false],
    ['no large title', { title: 'T', largeTitle: false }, false],
    ['no title', {}, false],
    ['over media', { title: 'T', tone: 'onImage' }, false],
  ];
  it.each(cases)('%s → %s', (_name, config, expected) => {
    expect(isInlineCloseHeader(config)).toBe(expected);
  });
});

// The bar's background was a Tailwind class (`bg-gradient-to-b from-bg
// to-transparent`). On native it compiled to a CSS gradient with Tailwind v4's
// `in oklab` interpolation, which React Native cannot parse, so it painted
// nothing. Once a list scrolled, the collapsed "Manage your Oxy Account" title
// sat on top of the rows (OxyHQ/oxy#1375 item 12). The background is now an SVG
// gradient Bloom paints itself: solid behind the nav row, fading only below it.
describe('the nav bar paints its own background', () => {
  type Node = { type: unknown; props: Record<string, unknown>; findAll: (p: (n: Node) => boolean) => Node[] };
  const stopsIn = (root: Node) =>
    root.findAll((n) => n.type === 'Stop').map((n) => ({
      offset: Number(n.props.offset),
      color: n.props.stopColor,
      opacity: n.props.stopOpacity,
    }));

  it('is solid in the surface colour across the nav row, then fades out', () => {
    const { getByTestId } = openDialog({ header: { title: 'Manage', onBack: () => {} } });
    const scrim = getByTestId('dialog-nav-scrim') as unknown as Node;
    expect(scrim.props.className).toBeUndefined();
    expect(getByTestId('dialog-nav-scrim-fill')).toBeTruthy();
    // The sheet's own fill: the `colors.background` the sheet paints.
    let background: string | undefined;
    function Probe() {
      background = useTheme().colors.background;
      return null;
    }
    render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Probe />
      </BloomThemeProvider>,
    );
    expect(typeof background).toBe('string');

    const stops = stopsIn(scrim);
    const barBottom = DIALOG_NAV_BAR_HEIGHT / (DIALOG_NAV_BAR_HEIGHT + 20);
    expect(stops).toEqual([
      { offset: 0, color: background, opacity: 1 },
      { offset: barBottom, color: background, opacity: 1 },
      { offset: 1, color: background, opacity: 0 },
    ]);
  });

  it('swaps to a dark scrim over media', () => {
    const { getByTestId } = openDialog({ header: { title: 'Photo', tone: 'onImage' } });
    const stops = stopsIn(getByTestId('dialog-nav-scrim') as unknown as Node);
    expect(stops[0]).toEqual({ offset: 0, color: '#000000', opacity: 0.6 });
    expect(stops[stops.length - 1]).toMatchObject({ offset: 1, opacity: 0 });
  });
});
