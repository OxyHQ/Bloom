/**
 * What a mail row offers on a PHONE, which `MailList.test.tsx` cannot see.
 *
 * That suite renders through react-native-web, where the row's default
 * placement is the hover rail and `accessibilityActions` is dropped by the
 * platform. Both of the claims here are native-only and both are the ones the
 * row was changed for:
 *
 *   - AT REST A TOUCH ROW DRAWS NO ACTION ICON. The rail defaults to `'none'`
 *     off web, and the actions live behind the drag instead.
 *   - A SWIPE IS UNREACHABLE BY A SCREEN READER, so the same actions reach the
 *     row's `accessibilityActions` — the rotor is the only path VoiceOver and
 *     TalkBack have to a gesture they cannot perform.
 *
 * It renders through the `react-native` MOCK (`Platform.OS === 'ios'`), so the
 * assertions are on the element TREE rather than on DOM attributes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import type { AccessibilityActionEvent } from 'react-native';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { MailRow } from '../mail-list';
import type { MailAction, MailRowProps } from '../mail-list/types';

const ARCHIVE: MailAction = { key: 'archive', label: 'Archive', icon: RiArchiveLine };
const SNOOZE: MailAction = { key: 'snooze', label: 'Snooze', icon: RiTimeLine };
const DELETE: MailAction = {
  key: 'delete',
  label: 'Delete',
  icon: RiDeleteBinLine,
  tone: 'negative',
};

const ROW = {
  sender: { name: 'Mireia Solans' },
  subject: 'Roof survey',
  snippet: 'The surveyor came back this morning',
  time: '14:02',
} satisfies Partial<MailRowProps> as MailRowProps;

function mount(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

/**
 * `includeHiddenElements`, because a CLOSED pane is hidden from assistive
 * technology on purpose and the default query would agree it is absent for the
 * wrong reason. Asking for hidden elements too is what makes "the rail is not
 * drawn" a statement about the TREE rather than about a11y visibility.
 */
const HIDDEN = { includeHiddenElements: true } as const;

describe('MailRow on a touch pointer', () => {
  it('draws NO action icon in the row at rest, and puts them behind the drag', () => {
    const screen = mount(
      <MailRow
        {...ROW}
        actions={[ARCHIVE, SNOOZE, DELETE]}
        swipeActions={{ left: [ARCHIVE], right: [SNOOZE, DELETE] }}
        testID="r"
      />,
    );
    // The rail is a pointer affordance and is not drawn here at all…
    expect(screen.queryByTestId('r-rail', HIDDEN)).toBeNull();
    expect(screen.queryByTestId('r-action-archive', HIDDEN)).toBeNull();
    // …while the panes behind the row are, hidden from a reader until opened.
    expect(screen.getByTestId('r-swipe-action-archive', HIDDEN)).toBeTruthy();
    expect(screen.getByTestId('r-swipe-action-delete', HIDDEN)).toBeTruthy();
  });

  it('takes the drag by DEFAULT on a touch pointer, with no prop asked of the app', () => {
    const screen = mount(
      <MailRow {...ROW} swipeActions={{ right: [DELETE] }} testID="r" />,
    );
    expect(screen.getByTestId('r-swipe', HIDDEN)).toBeTruthy();
  });

  it('offers every action on the ROTOR, once each, because a swipe is not reachable', () => {
    const fired: string[] = [];
    const own = jest.fn();
    const screen = mount(
      <MailRow
        {...ROW}
        // `archive` is on both affordances: one action, announced once.
        actions={[{ ...ARCHIVE, onPress: own }, SNOOZE]}
        actionsPlacement="inline"
        swipeActions={{ left: [ARCHIVE], right: [DELETE] }}
        onAction={(key) => fired.push(key)}
        testID="r"
      />,
    );
    const link = screen.getByTestId('r-link', HIDDEN);
    expect(link.props.accessibilityActions).toEqual([
      { name: 'archive', label: 'Archive' },
      { name: 'snooze', label: 'Snooze' },
      { name: 'delete', label: 'Delete' },
    ]);

    const invoke = (name: string) =>
      link.props.onAccessibilityAction({
        nativeEvent: { actionName: name },
      } as AccessibilityActionEvent);
    invoke('archive');
    invoke('delete');
    invoke('nothing-by-that-name');
    expect(fired).toEqual(['archive', 'delete']);
    expect(own).toHaveBeenCalledTimes(1);
  });

  it('carries no rotor actions at all when the row has none', () => {
    const screen = mount(<MailRow {...ROW} onPress={() => undefined} testID="r" />);
    expect(screen.getByTestId('r-link', HIDDEN).props.accessibilityActions).toBeUndefined();
  });
});
