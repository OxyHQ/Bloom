/**
 * @jest-environment jsdom
 *
 * `mail-list`, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM: the row geometry, the painted colours and the
 * accessibility ATTRIBUTES.
 *
 * A prop-level test cannot see `accessibilityState` being dropped on web, and
 * it cannot see an unread row whose "weight change" never reached a font
 * weight — which is this family's one visual claim. So the weight, the fill and
 * the composed name are read off the rendered nodes.
 *
 * The pure helpers (`visibleLabels`, `composeMailRowName`, `groupMailByDay`)
 * are asserted directly: they are where the arithmetic and the ORDER live, and
 * a rendered list cannot tell a stable bucketing from a lucky one.
 */
import { List, ListSelectionBar } from '../list/index.web';

import { ListItem } from '../list/index.web';

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  DEFAULT_MAIL_STRINGS,
  composeMailRowName,
  groupMailByDay,
  visibleLabels,
} from '../mail-list/shared';
import type { MailAction, MailLabel, MailSummary } from '../mail-list/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

const weightOf = (id: string) => getComputedStyle(byTestId(id)).fontWeight;

const ROW: MailSummary = {
  id: 'roof',
  sender: { name: 'Mireia Solans' },
  subject: 'Roof survey',
  snippet: 'The surveyor came back this morning',
  time: '14:02',
};

const LABELS: MailLabel[] = [
  { id: 'work', name: 'Work', tone: 'info' },
  { id: 'money', name: 'Finance', tone: 'success' },
  { id: 'q1', name: 'Q1' },
];

const ACTIONS: MailAction[] = [
  { key: 'archive', label: 'Archive', icon: RiArchiveLine },
  { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
];

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('visibleLabels', () => {
  const labels: MailLabel[] = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
  ];

  it('counts the overflow chip as one of the chips', () => {
    // Two chips out of four labels is ONE label and a "+3" — never two labels
    // and a "+2", which would draw three chips in the space of two.
    expect(visibleLabels(labels, 2)).toEqual({ shown: [labels[0]], overflow: 3 });
  });

  it('shows them all when they fit, and swallows them all at zero', () => {
    expect(visibleLabels(labels, 4)).toEqual({ shown: labels, overflow: 0 });
    expect(visibleLabels(labels, 0)).toEqual({ shown: [], overflow: 4 });
    expect(visibleLabels(undefined, 2)).toEqual({ shown: [], overflow: 0 });
  });
});

describe('composeMailRowName', () => {
  it('says every state the glyphs carry, in reading order', () => {
    expect(
      composeMailRowName(
        {
          sender: 'Mireia Solans',
          subject: 'Roof survey',
          snippet: 'The surveyor came back',
          time: '14:02',
          unread: true,
          starred: true,
          hasAttachment: true,
          threadCount: 4,
          labels: [{ id: 'work', name: 'Work' }],
        },
        DEFAULT_MAIL_STRINGS,
      ),
    ).toBe(
      'Mireia Solans, Roof survey, The surveyor came back, 14:02, Unread, Starred, Has attachment, 4 messages, Work',
    );
  });

  it('leads the snippet with the draft label, and drops what is absent', () => {
    expect(
      composeMailRowName(
        { sender: 'Nuria', subject: 'Railings', snippet: 'spacing', draft: true },
        DEFAULT_MAIL_STRINGS,
      ),
    ).toBe('Nuria, Railings, Draft: spacing');
  });

  it('does not announce a thread count of one', () => {
    const name = composeMailRowName(
      { sender: 'A', subject: 'B', threadCount: 1 },
      DEFAULT_MAIL_STRINGS,
    );
    expect(name).toBe('A, B');
  });
});

describe('groupMailByDay', () => {
  // LOCAL constructors, because the buckets are calendar days in the reader's
  // own zone — a UTC literal makes this test pass or fail by machine.
  const now = new Date(2026, 2, 14, 15, 0, 0).getTime();
  const at = (days: number, hours: number) => now - days * 86_400_000 - hours * 3_600_000;
  const mail = (id: string, date?: number): MailSummary => ({
    id,
    date,
    sender: { name: id },
    subject: id,
  });

  it('buckets newest-first and keeps each bucket in input order', () => {
    const sections = groupMailByDay(
      [mail('a', at(0, 1)), mail('b', at(2, 1)), mail('c', at(0, 3)), mail('d', at(1, 1))],
      { now, formatDate: () => '12 Mar' },
    );
    expect(sections.map((section) => section.title)).toEqual(['Today', 'Yesterday', '12 Mar']);
    expect(sections[0]?.mails.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('names Today and Yesterday by CALENDAR day, not by a 24-hour window', () => {
    // 23:50 "yesterday" is 15h10m before now, which a 24-hour window would call
    // today. A person calls it yesterday.
    const lastNight = new Date(2026, 2, 13, 23, 50, 0).getTime();
    const sections = groupMailByDay([mail('late', lastNight)], { now, formatDate: () => 'x' });
    expect(sections[0]?.title).toBe('Yesterday');
  });

  it('keeps undated mail in one trailing untitled bucket rather than dropping it', () => {
    const sections = groupMailByDay([mail('none'), mail('a', at(0, 1))], {
      now,
      formatDate: () => 'x',
    });
    expect(sections[sections.length - 1]).toEqual({
      key: 'undated',
      mails: [expect.objectContaining({ id: 'none' })],
    });
  });
});

// ---------------------------------------------------------------------------
//  MailRow, rendered
// ---------------------------------------------------------------------------

describe('ListItem mail content', () => {
  it('preserves unread weight and snippet contrast across the whole row', () => {
    mount(<ListItem mail={{ ...ROW, unread: true }} testID="r" />);
    const weight = weightOf('r-subject');
    const color = getComputedStyle(byTestId('r-snippet')).color;
    expect(weightOf('r-sender')).toBe('600');
    mount(<ListItem mail={ROW} testID="r" />);
    expect(weightOf('r-sender')).toBe('400');
    expect(weightOf('r-subject')).not.toBe(weight);
    expect(getComputedStyle(byTestId('r-snippet')).color).not.toBe(color);
  });
  it('announces sender, preview and all states once', () => {
    mount(
      <ListItem
        mail={{ ...ROW, unread: true, starred: true, hasAttachment: true, threadCount: 3 }}
        onPress={() => undefined}
        testID="r"
      />,
    );
    expect(byTestId('r-link').getAttribute('aria-label')).toBe(
      'Mireia Solans, Roof survey, The surveyor came back this morning, 14:02, Unread, Starred, Has attachment, 3 messages',
    );
    expect(byTestId('r-sender').closest('[aria-hidden="true"]')).not.toBeNull();
  });
  it('uses one compact geometry for mail and conversation content', () => {
    mount(
      <>
        <ListItem mail={ROW} testID="r" />
        <ListItem conversation={{ name: 'Ana' }} testID="chat" />
      </>,
    );
    expect(getComputedStyle(byTestId('r')).minHeight).toBe('56px');
    expect(getComputedStyle(byTestId('chat')).minHeight).toBe('56px');
    expect(getComputedStyle(byTestId('r-avatar-image')).width).toBe('36px');
    expect(byTestId('r-subject').contains(byTestId('r-snippet'))).toBe(true);
    expect(byTestId('r-sender').parentElement).not.toBe(byTestId('r-time').parentElement);
  });
  it('keeps the open destination separate from selection', () => {
    mount(<ListItem mail={ROW} active href="/messages/roof" testID="r" />);
    expect(byTestId('r-link').getAttribute('aria-current')).toBe('true');
    expect(byTestId('r-link').getAttribute('aria-selected')).toBeNull();
  });
  it('keeps avatar selection and the star outside the navigation link', () => {
    const open = jest.fn(),
      select = jest.fn(),
      star = jest.fn();
    mount(
      <ListItem
        mail={{ ...ROW, onStarredChange: star }}
        href="/mail/roof"
        onPress={open}
        onCheckedChange={select}
        testID="r"
      />,
    );
    expect(byTestId('r-avatar-image')).toBeTruthy();
    expect(byTestId('r-check').closest('a')).toBeNull();
    act(() => byTestId('r-check').click());
    act(() => byTestId('r-star').click());
    expect(select).toHaveBeenCalledWith(true);
    expect(star).toHaveBeenCalledWith(true);
    expect(open).not.toHaveBeenCalled();
  });
  it('disables navigation, selection and the independent star together', () => {
    const open = jest.fn(),
      select = jest.fn(),
      star = jest.fn();
    mount(
      <ListItem
        disabled
        mail={{ ...ROW, onStarredChange: star }}
        onPress={open}
        onCheckedChange={select}
        testID="r"
      />,
    );
    for (const part of ['link', 'check', 'star']) {
      expect(byTestId(`r-${part}`).getAttribute('aria-disabled')).toBe('true');
      act(() => byTestId(`r-${part}`).click());
    }
    expect(open).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(star).not.toHaveBeenCalled();
  });
  it('can hide a sender avatar while keeping selection available', () => {
    mount(
      <ListItem
        mail={{ ...ROW, showAvatar: false }}
        onCheckedChange={() => undefined}
        testID="r"
      />,
    );
    expect(maybe('r-avatar-image')).toBeNull();
    expect(byTestId('r-check')).toBeTruthy();
  });
  it('retains draft, labels and overflow without losing their accessible names', () => {
    mount(<ListItem mail={{ ...ROW, draft: true, labels: LABELS, maxLabels: 2 }} testID="r" />);
    expect(byTestId('r-snippet').textContent).toContain('Draft:');
    expect(byTestId('r-labels-work').textContent).toBe('Work');
    expect(byTestId('r-labels-overflow').textContent).toBe('+2');
    expect(byTestId('r-link').getAttribute('aria-label')).toContain('Q1');
  });
  it('keeps footer and attachment controls accessible without opening the message', () => {
    const open = jest.fn(),
      attachment = jest.fn(),
      extra = jest.fn();
    mount(
      <ListItem
        mail={ROW}
        href="/mail/roof"
        onPress={open}
        footer={<button onClick={extra}>Details</button>}
        attachments={<button onClick={attachment}>survey.pdf</button>}
        testID="r"
      />,
    );
    for (const part of ['footer', 'attachments']) {
      const el = byTestId(`r-${part}`);
      expect(el.closest('a')).toBeNull();
      expect(el.closest('[aria-hidden="true"]')).toBeNull();
      act(() => el.querySelector('button')!.click());
    }
    expect(attachment).toHaveBeenCalledTimes(1);
    expect(extra).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    expect(getComputedStyle(byTestId('r')).height).toBe('');
  });
  it('uses the shared menu for commands and preserves their callbacks', () => {
    const own = jest.fn(),
      action = jest.fn();
    mount(
      <ListItem
        mail={ROW}
        actions={[{ ...ACTIONS[0]!, onPress: own }]}
        onAction={action}
        testID="r"
      />,
    );
    act(() => byTestId('r-menu').click());
    const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (el) => el.textContent === 'Archive',
    );
    expect(item).toBeTruthy();
    act(() => item!.click());
    expect(action).toHaveBeenCalledWith('archive');
    expect(own).toHaveBeenCalledTimes(1);
  });
  it('shares swipe actions and hides closed actions from screen readers', () => {
    const action = jest.fn();
    mount(
      <ListItem
        mail={ROW}
        swipeEnabled
        swipeActions={{ right: [ACTIONS[1]!] }}
        onAction={action}
        testID="r"
      />,
    );
    const button = byTestId('r-swipe-action-delete');
    expect(button.closest('[aria-hidden="true"]')).not.toBeNull();
    act(() => button.click());
    expect(action).toHaveBeenCalledWith('delete');
  });
  it('disables gestures without remounting the row or exposing actions', () => {
    mount(
      <ListItem
        mail={ROW}
        swipeActions={{ right: [ACTIONS[1]!] }}
        swipeEnabled={false}
        testID="r"
      />,
    );
    const row = byTestId('r');
    expect(maybe('r-swipe-action-delete')).toBeNull();
    mount(<ListItem mail={ROW} swipeActions={{ right: [ACTIONS[1]!] }} swipeEnabled testID="r" />);
    expect(byTestId('r')).toBe(row);
  });
});

describe('List mail sections and selection toolbar', () => {
  it('renders grouped mail through the shared list', () => {
    mount(
      <List
        accessibilityLabel="Inbox"
        sections={[
          { id: 'today', title: 'Today', items: [{ id: ROW.id, mail: ROW }] },
          {
            id: 'older',
            title: '11 Mar',
            items: [
              { id: 'invoice', mail: { sender: { name: 'Bastia' }, subject: 'Invoice 2214' } },
            ],
          },
        ]}
      />,
    );
    expect(
      [...container.querySelectorAll('[role="list"]')].map((el) => el.getAttribute('aria-label')),
    ).toEqual(['Inbox', 'Today', '11 Mar']);
  });
  it('preserves select-all and clear in the shared toolbar', () => {
    const all = jest.fn(),
      clear = jest.fn();
    mount(
      <List
        items={[{ id: ROW.id, mail: ROW }]}
        header={
          <ListSelectionBar
            count={1}
            total={2}
            onSelectAll={all}
            onClear={clear}
            actions={ACTIONS}
            testID="bar"
          />
        }
      />,
    );
    act(() => byTestId('bar-select-all').click());
    act(() => byTestId('bar-clear').click());
    expect(all).toHaveBeenCalledWith(true);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});

describe('ListSelectionBar', () => {
  it('keeps select-all reachable when selection mode starts with no selected rows', () => {
    const select = jest.fn();
    mount(<ListSelectionBar selecting count={0} total={4} onSelectAll={select} testID="b" />);
    const checkbox = byTestId('b-select-all');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    act(() => checkbox.click());
    expect(select).toHaveBeenCalledWith(true);
  });

  it('draws nothing at zero, and is indeterminate below the total', () => {
    mount(<ListSelectionBar count={0} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(maybe('b')).toBeNull();

    act(() => root.render(<div />));
    mount(<ListSelectionBar count={2} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-select-all').getAttribute('aria-checked')).toBe('mixed');

    act(() => root.render(<div />));
    mount(<ListSelectionBar count={4} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-select-all').getAttribute('aria-checked')).toBe('true');
  });
});
