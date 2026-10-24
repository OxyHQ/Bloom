/**
 * The pressed fill of a list row on NATIVE comes from Pressable's own `pressed`
 * state, never from a copy the row mirrors out of `onPressIn` / `onPressOut`.
 *
 * Measured on Android (RN 0.88 Fabric): tap a chat row that pushes a screen,
 * come back, and the row was still painted pressed. The row kept `pressed` in
 * its OWN state, set from the link's press-in and cleared by its press-out —
 * and Android can lose that press-out (Pressability delays it by a timer that a
 * reset or unmount of the Pressable cancels). A fill read from the Pressable
 * has no second copy to go stale.
 *
 * Rendered through the `react-native` MOCK (`Platform.OS === 'ios'`), whose
 * `Pressable` hands its `style` through untouched, so the test can call the
 * style function the way Pressable would with `{ pressed }`. It asserts that:
 *
 *   - the link's `style` IS a function of `pressed` (the paint has one owner),
 *   - the link takes no `onPressIn` / `onPressOut` (nothing is mirrored),
 *   - the row's own fill is not driven by a press at all,
 *   - a selected row keeps its selected fill and gains no pressed one.
 */
import type React from 'react';
import { render } from '@testing-library/react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ArchivedRow, ChatListItem, ChatSearchResults } from '../chat-list';
import { resolveChatListPaint } from '../chat-list/shared';
import { MailRow } from '../mail-list';
import type { MailRowProps } from '../mail-list/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ReadTheme />
      {ui}
    </BloomThemeProvider>,
  );
}

type Screen = ReturnType<typeof mount>;
type StyleFn = (state: { pressed: boolean }) => StyleProp<ViewStyle>;

const HIDDEN = { includeHiddenElements: true } as const;

/** The composite `Pressable` element whose host carries `testID`. */
function linkOf(screen: Screen, testID: string) {
  const host = screen.getByTestId(testID, HIDDEN);
  const link = screen.UNSAFE_getAllByType(Pressable).find((el) => el.props.testID === testID);
  if (link === undefined) throw new Error(`No Pressable for testID "${testID}"`);
  return { host, link };
}

function fillOf(style: StyleProp<ViewStyle>): unknown {
  return StyleSheet.flatten(style)?.backgroundColor;
}

/** The pressed-fill contract every covering-link row holds on native. */
function expectPressPaintedByPressable(
  screen: Screen,
  rowID: string,
  expected: { pressed: string | undefined; row: string },
) {
  const { link } = linkOf(screen, `${rowID}-link`);
  expect(link.props.onPressIn).toBeUndefined();
  expect(link.props.onPressOut).toBeUndefined();
  const style = link.props.style as StyleFn | StyleProp<ViewStyle>;
  if (expected.pressed === undefined) {
    // Nothing to paint: either no function at all, or one that adds no fill.
    const resolved = typeof style === 'function' ? style({ pressed: true }) : style;
    expect(fillOf(resolved)).toBeUndefined();
  } else {
    expect(typeof style).toBe('function');
    expect(fillOf((style as StyleFn)({ pressed: true }))).toBe(expected.pressed);
    expect(fillOf((style as StyleFn)({ pressed: false }))).toBeUndefined();
  }
  expect(fillOf(screen.getByTestId(rowID, HIDDEN).props.style)).toBe(expected.row);
}

describe('pressed fill on native list rows', () => {
  it('ChatListItem: the link paints the press, the row never does', () => {
    const screen = mount(<ChatListItem name="Ana" onPress={() => undefined} testID="r" />);
    const paint = resolveChatListPaint(theme);
    expectPressPaintedByPressable(screen, 'r', { pressed: paint.hover, row: 'transparent' });
  });

  it('ChatListItem: a selected row keeps its fill and gains no pressed one', () => {
    const screen = mount(<ChatListItem name="Ana" selected onPress={() => undefined} testID="r" />);
    const paint = resolveChatListPaint(theme);
    expectPressPaintedByPressable(screen, 'r', { pressed: undefined, row: paint.selected });
  });

  it('ArchivedRow', () => {
    const screen = mount(<ArchivedRow count={3} onPress={() => undefined} testID="r" />);
    const paint = resolveChatListPaint(theme);
    expectPressPaintedByPressable(screen, 'r', { pressed: paint.hover, row: 'transparent' });
  });

  it('ChatSearchResults rows', () => {
    const screen = mount(
      <ChatSearchResults
        query="an"
        results={[{ id: 'a', kind: 'chat', name: 'Ana' }]}
        onResultPress={() => undefined}
        testID="s"
      />,
    );
    const paint = resolveChatListPaint(theme);
    expectPressPaintedByPressable(screen, 's-result-a', {
      pressed: paint.hover,
      row: 'transparent',
    });
  });

  it('MailRow, unselected and selected', () => {
    const ROW = {
      sender: { name: 'Mireia Solans' },
      subject: 'Roof survey',
      snippet: 'The surveyor came back this morning',
      time: '14:02',
    } satisfies Partial<MailRowProps> as MailRowProps;
    const plain = mount(<MailRow {...ROW} onPress={() => undefined} testID="m" />);
    const { link } = linkOf(plain, 'm-link');
    const pressedFill = fillOf((link.props.style as StyleFn)({ pressed: true }));
    expect(typeof pressedFill).toBe('string');
    expect(pressedFill).not.toBe('transparent');
    expectPressPaintedByPressable(plain, 'm', {
      pressed: pressedFill as string,
      row: 'transparent',
    });
    plain.unmount();

    const selected = mount(<MailRow {...ROW} selected onPress={() => undefined} testID="m" />);
    const rowFill = fillOf(selected.getByTestId('m', HIDDEN).props.style);
    expect(rowFill).not.toBe('transparent');
    expectPressPaintedByPressable(selected, 'm', {
      pressed: undefined,
      row: rowFill as string,
    });
  });
});
