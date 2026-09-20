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
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { MailList, MailRow, MailSelectionBar } from '../mail-list';
import {
  DEFAULT_MAIL_STRINGS,
  MAIL_ROW_GEOMETRY,
  composeMailRowName,
  groupMailByDay,
  resolveMailPaint,
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

describe('MailRow', () => {
  it('changes the WHOLE row weight when unread, not a dot', () => {
    mount(<MailRow {...ROW} unread testID="r" />);
    const unreadSender = weightOf('r-sender');
    const unreadSubject = weightOf('r-subject');

    act(() => root.render(<div />));
    mount(<MailRow {...ROW} testID="r" />);
    expect(weightOf('r-sender')).not.toBe(unreadSender);
    expect(weightOf('r-subject')).not.toBe(unreadSubject);
    expect(unreadSender).toBe('600');
    expect(weightOf('r-sender')).toBe('400');
  });

  it('paints the read snippet a quieter rung than the unread one', () => {
    mount(<MailRow {...ROW} unread testID="r" />);
    const loud = getComputedStyle(byTestId('r-snippet')).color;
    act(() => root.render(<div />));
    mount(<MailRow {...ROW} testID="r" />);
    expect(getComputedStyle(byTestId('r-snippet')).color).not.toBe(loud);
  });

  it('gives the row one link carrying the whole composed name', () => {
    mount(
      <MailRow
        {...ROW}
        unread
        starred
        hasAttachment
        threadCount={3}
        onPress={() => undefined}
        testID="r"
      />,
    );
    const link = byTestId('r-link');
    expect(link.getAttribute('aria-label')).toBe(
      'Mireia Solans, Roof survey, The surveyor came back this morning, 14:02, Unread, Starred, Has attachment, 3 messages',
    );
    expect(link.getAttribute('role')).toBe('button');
  });

  it('marks the open row aria-current, never aria-selected', () => {
    mount(<MailRow {...ROW} selected onPress={() => undefined} testID="r" />);
    expect(byTestId('r-link').getAttribute('aria-current')).toBe('true');
    expect(byTestId('r-link').getAttribute('aria-selected')).toBeNull();
  });

  it('spells the star toggle with aria-pressed, and draws NO star where it is not a control', () => {
    mount(<MailRow {...ROW} starred onStarredChange={() => undefined} testID="r" />);
    expect(byTestId('r-star').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('r-star').getAttribute('aria-label')).toBe('Starred');

    // No handler, no glyph — and the state survives in the row's name, which is
    // the whole reason the marker can be dropped.
    act(() => root.render(<div />));
    mount(<MailRow {...ROW} starred onPress={() => undefined} testID="r" />);
    expect(maybe('r-star')).toBeNull();
    expect(byTestId('r-link').getAttribute('aria-label')).toContain('Starred');

    // Both densities: the dense row keeps the star in its trailing run, and
    // drops it there on the same rule.
    act(() => root.render(<div />));
    mount(<MailRow {...ROW} starred density="compact" testID="r" />);
    expect(maybe('r-star')).toBeNull();
  });

  it('draws a checkbox in place of the avatar only when the list can multi-select', () => {
    mount(<MailRow {...ROW} testID="r" />);
    expect(maybe('r-checkbox')).toBeNull();
    expect(maybe('r-avatar')).not.toBeNull();

    act(() => root.render(<div />));
    mount(<MailRow {...ROW} checked onCheckedChange={() => undefined} testID="r" />);
    expect(byTestId('r-checkbox').getAttribute('aria-checked')).toBe('true');
    expect(maybe('r-avatar')).toBeNull();
  });

  it('draws the compact row at its exact height and the comfortable one at its floor', () => {
    mount(<MailRow {...ROW} density="compact" testID="r" />);
    expect(getComputedStyle(byTestId('r')).height).toBe(
      `${MAIL_ROW_GEOMETRY.compact.height}px`,
    );
    act(() => root.render(<div />));
    mount(<MailRow {...ROW} testID="r" />);
    expect(getComputedStyle(byTestId('r')).minHeight).toBe(
      `${MAIL_ROW_GEOMETRY.comfortable.minHeight}px`,
    );
    expect(getComputedStyle(byTestId('r')).height).toBe('');
  });

  it.each(['compact', 'comfortable'] as const)(
    'keeps the subject and the snippet inside ONE text node at %s, so neither pushes the row',
    (density) => {
      mount(
        <MailRow
          {...ROW}
          density={density}
          subject={'A subject long enough to need the whole row'.repeat(3)}
          snippet={'and a snippet just as long'.repeat(4)}
          testID="r"
        />,
      );
      const subject = byTestId('r-subject');
      // The snippet is a nested SPAN of the subject, never a sibling: a sibling
      // is a second flex child claiming its content's width.
      expect(subject.contains(byTestId('r-snippet'))).toBe(true);
      expect(subject.textContent).toContain('and a snippet just as long');
    },
  );

  it('draws the phone row two lines tall at 64/40, with the time and the states in their own column', () => {
    mount(<MailRow {...ROW} labels={LABELS} testID="r" />);
    // 64, not the conversation row's 72: a mail row carries no presence dot,
    // no typing line and no delivery ticks, and the same height left a band of
    // empty pixels under the second line.
    expect(getComputedStyle(byTestId('r')).minHeight).toBe('64px');
    expect(getComputedStyle(byTestId('r-avatar')).height).toBe('40px');
    // Line one is the sender ALONE and line two is the subject with the snippet
    // inside it: the time is not strung along a text line but sits in the right
    // column, which is the shape `chat-list` draws.
    const sender = byTestId('r-sender');
    const time = byTestId('r-time');
    const subject = byTestId('r-subject');
    expect(sender.parentElement).not.toBe(time.parentElement);
    expect(subject.parentElement).not.toBe(sender.parentElement);
  });

  it('collapses the labels to a dot each on the two-line row, and keeps the names on the dense one', () => {
    mount(<MailRow {...ROW} labels={LABELS} maxLabels={2} testID="r" />);
    // No named chip on this row: it would sit on the subject's own line and
    // take width from the thing the row is read for. Every label is a dot, and
    // every one of them is still in the row's composed name.
    expect(maybe('r-labels-work')).toBeNull();
    const dot = byTestId('r-labels-dot-work');
    expect(getComputedStyle(dot).width).toBe('8px');
    expect(getComputedStyle(dot).backgroundColor).not.toBe('');
    // And the third is silent on the row while still being announced.
    expect(maybe('r-labels-dot-q1')).toBeNull();
    expect(byTestId('r-link').getAttribute('aria-label')).toContain('Q1');
  });

  it('keeps chips at the dense density, where there is one line and room for them', () => {
    mount(<MailRow {...ROW} density="compact" labels={LABELS} maxLabels={2} testID="r" />);
    expect(byTestId('r-labels-work').textContent).toBe('Work');
    expect(byTestId('r-labels-overflow').textContent).toBe('+2');
    expect(maybe('r-labels-dot-money')).toBeNull();
  });

  it('draws the hover rail only when a placement asks for it', () => {
    mount(<MailRow {...ROW} actions={ACTIONS} actionsPlacement="none" testID="r" />);
    expect(maybe('r-rail')).toBeNull();

    act(() => root.render(<div />));
    mount(<MailRow {...ROW} actions={ACTIONS} actionsPlacement="inline" testID="r" />);
    expect(byTestId('r-action-archive').getAttribute('aria-label')).toBe('Archive');
    expect(byTestId('r-action-delete').getAttribute('aria-label')).toBe('Delete');
  });

  it('puts the row actions behind a DRAG, with nothing drawn in the row at rest', () => {
    const calls: string[] = [];
    mount(
      <MailRow
        {...ROW}
        swipeActions={{ left: [ACTIONS[0]!], right: [ACTIONS[1]!] }}
        swipeEnabled
        onAction={(key) => calls.push(key)}
        testID="r"
      />,
    );
    // No rail: the only `actions` here are the panes'.
    expect(maybe('r-rail')).toBeNull();
    const archive = byTestId('r-swipe-action-archive');
    expect(archive.getAttribute('role')).toBe('button');
    expect(archive.getAttribute('aria-label')).toBe('Archive');
    act(() => archive.click());
    act(() => byTestId('r-swipe-action-delete').click());
    expect(calls).toEqual(['archive', 'delete']);
  });

  it('hides a closed pane from assistive technology, rather than leaving it invisible in the tab order', () => {
    mount(
      <MailRow {...ROW} swipeActions={{ right: [ACTIONS[1]!] }} swipeEnabled testID="r" />,
    );
    const pane = byTestId('r-swipe-action-delete').parentElement?.parentElement;
    expect(pane?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not wrap the row at all when the drag is off, or when no side has actions', () => {
    mount(
      <MailRow
        {...ROW}
        swipeActions={{ right: [ACTIONS[1]!] }}
        swipeEnabled={false}
        testID="r"
      />,
    );
    expect(maybe('r-swipe')).toBeNull();

    act(() => root.render(<div />));
    mount(<MailRow {...ROW} swipeActions={{}} swipeEnabled testID="r" />);
    expect(maybe('r-swipe')).toBeNull();
  });

  it('paints the selected fill as a further step off the hovered one', () => {
    mount(<MailRow {...ROW} testID="r" />);
    const paint = resolveMailPaint(theme, theme.colors.background);
    expect(paint.hover).not.toBe(paint.surface);
    expect(paint.selected).not.toBe(paint.hover);
  });
});

// ---------------------------------------------------------------------------
//  MailList, rendered
// ---------------------------------------------------------------------------

describe('MailList', () => {
  const mails: MailSummary[] = [
    ROW,
    { id: 'invoice', sender: { name: 'Bastia' }, subject: 'Invoice 2214' },
  ];

  it('names each titled section as a nested list', () => {
    mount(
      <MailList
        sections={[
          { key: 'today', title: 'Today', mails: [ROW] },
          { key: 'older', title: '11 Mar', mails: [mails[1] as MailSummary] },
        ]}
        accessibilityLabel="Inbox"
        testID="l"
      />,
    );
    const lists = [...container.querySelectorAll('[role="list"]')].map((el) =>
      el.getAttribute('aria-label'),
    );
    expect(lists).toEqual(['Inbox', 'Today', '11 Mar']);
  });

  it('announces loading ONCE on the region and hides the placeholders', () => {
    mount(<MailList loading loadingCount={3} testID="l" />);
    expect(byTestId('l').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('l-skeleton').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('l-skeleton-row-2')).toBeTruthy();
  });

  it('draws the empty state only when nothing is loading', () => {
    mount(<MailList mails={[]} testID="l" />);
    expect(byTestId('l-empty').textContent).toContain(DEFAULT_MAIL_STRINGS.emptyTitle);
  });

  it('mounts the selection bar itself, and only once something is checked', () => {
    mount(<MailList mails={mails} onCheckedIdsChange={() => undefined} testID="l" />);
    expect(maybe('l-selection')).toBeNull();

    act(() => root.render(<div />));
    mount(
      <MailList
        mails={mails}
        checkedIds={['roof']}
        onCheckedIdsChange={() => undefined}
        bulkActions={ACTIONS}
        testID="l"
      />,
    );
    expect(byTestId('l-selection-count').textContent).toBe('1 selected');
    expect(byTestId('l-selection-action-archive').getAttribute('aria-label')).toBe('Archive');
  });

  it('draws no checkbox at all without onCheckedIdsChange', () => {
    mount(<MailList mails={mails} testID="l" />);
    expect(maybe('l-mail-roof-checkbox')).toBeNull();
    expect(maybe('l-selection')).toBeNull();
  });

  it('resolves select-all and clear against every id in every section', () => {
    const seen: string[][] = [];
    mount(
      <MailList
        sections={[
          { key: 'a', title: 'Today', mails: [ROW] },
          { key: 'b', title: '11 Mar', mails: [mails[1] as MailSummary] },
        ]}
        checkedIds={['roof']}
        onCheckedIdsChange={(ids) => seen.push(ids)}
        testID="l"
      />,
    );
    act(() => {
      byTestId('l-selection-select-all').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });
    expect(seen[seen.length - 1]).toEqual(['roof', 'invoice']);
    act(() => {
      byTestId('l-selection-clear').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(seen[seen.length - 1]).toEqual([]);
  });
});

describe('MailSelectionBar', () => {
  it('draws nothing at zero, and is indeterminate below the total', () => {
    mount(<MailSelectionBar count={0} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(maybe('b')).toBeNull();

    act(() => root.render(<div />));
    mount(<MailSelectionBar count={2} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-select-all').getAttribute('aria-checked')).toBe('mixed');

    act(() => root.render(<div />));
    mount(<MailSelectionBar count={4} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-select-all').getAttribute('aria-checked')).toBe('true');
  });
});
