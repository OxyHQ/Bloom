/**
 * @jest-environment jsdom
 *
 * `chat-people` through the REAL react-native-web, so the assertions read the
 * emitted DOM rather than the props: the selection row's `role="checkbox"` and
 * its `aria-checked`, the alphabet rail's names, the role badges, and the two
 * pure functions that carry the arithmetic — `storyProgressFill` and
 * `nameCounterTone`.
 */
import type { PersonSummary } from '../chat-people/types';

import { List, ListItem } from '../list';
import { Badge } from '../badge';
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

interface MotionState {
  reduced: boolean;
}
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  const g = globalThis as { __peopleMotion?: MotionState };
  const state = (g.__peopleMotion ??= { reduced: false });
  return {
    ...actual,
    __esModule: true,
  };
});

jest.mock('../hooks/use-prefers-reduced-motion', () => {
  const g = globalThis as { __peopleMotion?: MotionState };
  return { usePrefersReducedMotion: () => (g.__peopleMotion ??= { reduced: false }).reduced };
});

const motion = ((globalThis as { __peopleMotion?: MotionState }).__peopleMotion ??= {
  reduced: false,
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  NewGroupForm,
  SelectedChipsRow,
  StoryProgressBars,
  StoryViewer,
  CONTACT_ALPHABET,
  contactSectionIndex,
  nameCounterTone,
  storyProgressFill,
  storyTapZone,
} from '../chat-people';
import { contactIndexLetters, memberBadgeLabel, MEMBER_LABELS } from '../chat-people/shared';
import type { ContactSection } from '../chat-people/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
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
  motion.reduced = false;
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

function press(el: HTMLElement): void {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const text = (el: HTMLElement): string => el.textContent ?? '';

const SECTIONS: ContactSection[] = [
  {
    letter: 'A',
    contacts: [
      { id: 'ana', name: 'Ana Restrepo', subtitle: 'online' },
      { id: 'ade', name: 'Adeola Bakare' },
    ],
  },
  { letter: 'K', contacts: [{ id: 'kofi', name: 'Kofi Mensah' }] },
  { letter: 'Z', contacts: [] },
];

// ---------------------------------------------------------------------------
//  ContactRow
// ---------------------------------------------------------------------------

describe('ListItem person content', () => {
  it('renders application identity slots while retaining row naming and selection behavior', () => {
    const changes: boolean[] = [];
    mount(
      <ListItem
        person={{ name: 'Ana Restrepo', subtitle: '@ana@example.social' }}
        leading={<span data-testid="custom-avatar">Verified avatar</span>}
        content={<span data-testid="custom-identity">Ana · verified · example.social</span>}
        onCheckedChange={(value) => changes.push(value)}
        selecting
        testID="r"
      />,
    );
    expect(text(byTestId('custom-avatar'))).toContain('Verified avatar');
    expect(text(byTestId('custom-identity'))).toContain('example.social');
    expect(maybe('r-name')).toBeNull();
    expect(maybe('r-subtitle')).toBeNull();
    expect(byTestId('r-check').getAttribute('aria-label')).toBe(
      'Ana Restrepo, @ana@example.social',
    );
    press(byTestId('r-check'));
    expect(changes).toEqual([true]);
    expect(container.querySelectorAll('[role="checkbox"]').length).toBe(1);
  });

  it('supports intentionally empty slots without losing the accessible person name', () => {
    mount(
      <ListItem
        person={{ name: 'Ana', subtitle: '@ana' }}
        leading={null}
        content={null}
        onPress={() => undefined}
        testID="r"
      />,
    );
    expect(maybe('r-name')).toBeNull();
    expect(maybe('r-subtitle')).toBeNull();
    expect(byTestId('r-link').getAttribute('aria-label')).toBe('Ana, @ana');
    expect(container.querySelector('[data-testid="r"] [role="img"]')).toBeNull();
  });

  it('derives the trailing affordance from the handlers it was given', () => {
    mount(
      <ListItem person={{ name: 'Ana' }} onCheckedChange={() => undefined} selecting testID="r" />,
    );
    expect(maybe('r-check')).not.toBeNull();
    expect(maybe('r-action')).toBeNull();

    mount(<ListItem person={{ name: 'Ana', onAction: () => undefined }} testID="r" />);
    expect(maybe('r-check')).toBeNull();
    expect(maybe('r-action')).not.toBeNull();

    mount(<ListItem person={{ name: 'Ana' }} testID="r" />);
    expect(maybe('r-check')).toBeNull();
    expect(maybe('r-action')).toBeNull();
  });

  it('makes the ROW the checkbox — one role, not two', () => {
    mount(
      <ListItem
        person={{ name: 'Ana Restrepo' }}
        checked={true}
        onCheckedChange={() => undefined}
        selecting
        testID="r"
      />,
    );
    const row = byTestId('r-check');
    expect(row.getAttribute('role')).toBe('checkbox');
    expect(row.getAttribute('aria-checked')).toBe('true');
    expect(row.getAttribute('aria-label')).toBe('Ana Restrepo');
    // Exactly one checkbox in the subtree: nesting Bloom's `Checkbox` here would
    // announce the same control twice.
    expect(container.querySelectorAll('[role="checkbox"]').length).toBe(1);
  });

  it('emits the NEXT selected value', () => {
    const changes: boolean[] = [];
    mount(
      <ListItem
        person={{ name: 'Ana' }}
        onCheckedChange={(n) => changes.push(n)}
        selecting
        testID="r"
      />,
    );
    press(byTestId('r-check'));
    expect(changes).toEqual([true]);
  });

  it('names a plain row with its subtitle, so the list reads as rows not names', () => {
    mount(
      <ListItem
        person={{ name: 'Ana Restrepo', subtitle: 'last seen recently' }}
        onPress={() => undefined}
        testID="r"
      />,
    );
    expect(byTestId('r-link').getAttribute('aria-label')).toBe('Ana Restrepo, last seen recently');
  });

  it('swaps the action button for a quiet mark once it is done', () => {
    mount(
      <ListItem
        person={{ name: 'Ana', actionLabel: 'Invite', onAction: () => undefined }}
        testID="r"
      />,
    );
    expect(text(byTestId('r-action'))).toContain('Invite');
    mount(
      <ListItem
        person={{ name: 'Ana', actionLabel: 'Invite', actionDone: true, onAction: () => undefined }}
        testID="r"
      />,
    );
    expect(maybe('r-action')).toBeNull();
    expect(text(byTestId('r-action-done'))).toContain('Added');
  });

  it('reports disabled the way web reads it', () => {
    mount(<ListItem person={{ name: 'Ana' }} disabled onPress={() => undefined} testID="r" />);
    expect(byTestId('r-link').getAttribute('aria-disabled')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  ContactList and the index rail
// ---------------------------------------------------------------------------

describe('contactIndexLetters / contactSectionIndex', () => {
  it('defaults the rail to the sections that exist, in their order', () => {
    expect(contactIndexLetters(SECTIONS)).toEqual(['A', 'K', 'Z']);
    expect(contactIndexLetters(SECTIONS, ['A', 'B'])).toEqual(['A', 'B']);
  });

  it('answers -1 for a letter with no section, so the rail can do nothing', () => {
    expect(contactSectionIndex(SECTIONS, 'K')).toBe(1);
    expect(contactSectionIndex(SECTIONS, 'Q')).toBe(-1);
  });

  it('puts # last in the default alphabet, where the thumb does not land', () => {
    expect(CONTACT_ALPHABET).toHaveLength(27);
    expect(CONTACT_ALPHABET[0]).toBe('A');
    expect(CONTACT_ALPHABET[26]).toBe('#');
  });
});

describe('List contact sections', () => {
  it('drops an empty section from the list AND from the rail', () => {
    mount(
      <List
        sections={SECTIONS.map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          SECTIONS.filter((section) => section.contacts.length > 0).length > 1
            ? { ids: undefined, activeId: undefined, onJump: undefined, labelFor: undefined }
            : undefined
        }
      />,
    );
    expect(maybe('l-heading-A')).not.toBeNull();
    expect(maybe('l-heading-K')).not.toBeNull();
    expect(maybe('l-heading-Z')).toBeNull();
    expect(maybe('l-jump-Z')).toBeNull();
  });

  it('names every rail button by where it goes, and reports the jump', () => {
    const jumps: string[] = [];
    mount(
      <List
        sections={SECTIONS.map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          SECTIONS.filter((section) => section.contacts.length > 0).length > 1
            ? {
                ids: undefined,
                activeId: undefined,
                onJump: (l) => jumps.push(l),
                labelFor: undefined,
              }
            : undefined
        }
      />,
    );
    expect(byTestId('l-jump-K').getAttribute('aria-label')).toBe('Jump to K');
    press(byTestId('l-jump-K'));
    expect(jumps).toEqual(['K']);
  });

  it('does NOT report a jump to a letter with no section', () => {
    const jumps: string[] = [];
    mount(
      <List
        sections={SECTIONS.map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          SECTIONS.filter((section) => section.contacts.length > 0).length > 1
            ? {
                ids: ['A', 'Q'],
                activeId: undefined,
                onJump: (l) => jumps.push(l),
                labelFor: undefined,
              }
            : undefined
        }
      />,
    );
    press(byTestId('l-jump-Q'));
    expect(jumps).toEqual([]);
    press(byTestId('l-jump-A'));
    expect(jumps).toEqual(['A']);
  });

  it('hides the rail for a single section unless asked for', () => {
    mount(
      <List
        sections={[SECTIONS[0] as ContactSection].map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          [SECTIONS[0] as ContactSection].filter((section) => section.contacts.length > 0).length >
          1
            ? { ids: undefined, activeId: undefined, onJump: undefined, labelFor: undefined }
            : undefined
        }
      />,
    );
    expect(maybe('l-index')).toBeNull();
    mount(
      <List
        sections={[SECTIONS[0] as ContactSection].map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={{
          ids: undefined,
          activeId: undefined,
          onJump: undefined,
          labelFor: undefined,
        }}
      />,
    );
    expect(maybe('l-index')).not.toBeNull();
  });

  it('routes a row press and a selection change with the contact id', () => {
    const opened: string[] = [];
    const picked: [string, boolean][] = [];
    mount(
      <List
        sections={SECTIONS.map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
            onPress: () => opened.push(contact.id),
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          SECTIONS.filter((section) => section.contacts.length > 0).length > 1
            ? { ids: undefined, activeId: undefined, onJump: undefined, labelFor: undefined }
            : undefined
        }
      />,
    );
    press(byTestId('l-kofi-link'));
    expect(opened).toEqual(['kofi']);

    mount(
      <List
        sections={SECTIONS.map((section) => ({
          id: section.letter,
          title: section.letter,
          items: section.contacts.map((contact: PersonSummary) => ({
            id: contact.id,
            person: { ...contact },
            selecting: true,
            onCheckedChange: (next: boolean) => picked.push([contact.id, next]),
          })),
        }))}
        testID={'l'}
        scrollable
        sectionIndex={
          SECTIONS.filter((section) => section.contacts.length > 0).length > 1
            ? { ids: undefined, activeId: undefined, onJump: undefined, labelFor: undefined }
            : undefined
        }
      />,
    );
    press(byTestId('l-ana-check'));
    expect(picked).toEqual([['ana', true]]);
  });

  it('flat layout: one unlabelled list of every match, in order, with no rail', () => {
    mount(
      <List
        sections={[
          {
            id: 'results',
            title: undefined,
            items: SECTIONS.flatMap((section) => section.contacts).map(
              (contact: PersonSummary) => ({
                id: contact.id,
                person: { ...contact },
              }),
            ),
          },
        ]}
        testID={'l'}
        scrollable
        stickyHeaders={false}
      />,
    );
    // No letter heading and no rail, even with `showIndex` asking for one.
    expect(container.querySelector('[data-testid^="l-heading"]')).toBeNull();
    expect(maybe('l-index')).toBeNull();
    const order = [...container.querySelectorAll('[data-testid^="l-"]')]
      .map((el) => el.getAttribute('data-testid'))
      .filter((id) => id !== null && /^l-(ana|ade|kofi)$/.test(id));
    expect(order).toEqual(['l-ana', 'l-ade', 'l-kofi']);
  });

  it('flat layout: one heading when given a label, and the empty state when nothing matched', () => {
    mount(
      <List
        sections={[
          {
            id: 'results',
            title: 'Results',
            items: SECTIONS.flatMap((section) => section.contacts).map(
              (contact: PersonSummary) => ({
                id: contact.id,
                person: { ...contact },
              }),
            ),
          },
        ]}
        testID={'l'}
        scrollable
        stickyHeaders={false}
      />,
    );
    expect(text(byTestId('l-heading-results'))).toBe('Results');
    expect(maybe('l-heading-A')).toBeNull();

    mount(
      <List
        sections={[
          {
            id: 'results',
            title: 'Results',
            items: [{ letter: 'A', contacts: [] }]
              .flatMap((section) => section.contacts)
              .map((contact: PersonSummary) => ({
                id: contact.id,
                person: { ...contact },
              })),
          },
        ]}
        testID={'l'}
        empty={<span data-testid="l-none" />}
        scrollable
        stickyHeaders={false}
      />,
    );
    expect(maybe('l-none')).not.toBeNull();
    expect(maybe('l-heading-results')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  SelectedChipsRow
// ---------------------------------------------------------------------------

describe('SelectedChipsRow', () => {
  const people = [
    { id: 'a', name: 'Ana Restrepo' },
    { id: 'b', name: 'Kofi Mensah' },
  ];

  it('names each × by the person it removes', () => {
    mount(<SelectedChipsRow people={people} onRemove={() => undefined} testID="c" />);
    expect(byTestId('c-chip-a-remove').getAttribute('aria-label')).toBe('Remove Ana Restrepo');
  });

  it('removes by id', () => {
    const removed: string[] = [];
    mount(<SelectedChipsRow people={people} onRemove={(id) => removed.push(id)} testID="c" />);
    press(byTestId('c-chip-b-remove'));
    expect(removed).toEqual(['b']);
  });

  it('renders nothing at all with nobody picked and no empty state', () => {
    mount(<SelectedChipsRow people={[]} testID="c" />);
    expect(maybe('c')).toBeNull();
  });

  it('drops the × entirely when there is no remove handler', () => {
    mount(<SelectedChipsRow people={people} testID="c" />);
    expect(maybe('c-chip-a-remove')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  NewGroupForm
// ---------------------------------------------------------------------------

describe('nameCounterTone', () => {
  it('warns BEFORE the limit, because the input stops at it', () => {
    expect(nameCounterTone(0, 64)).toBe('quiet');
    expect(nameCounterTone(57, 64)).toBe('quiet');
    expect(nameCounterTone(58, 64)).toBe('warn'); // 64 * 0.9 = 57.6
    expect(nameCounterTone(64, 64)).toBe('warn');
    expect(nameCounterTone(65, 64)).toBe('over');
    expect(nameCounterTone(3, 0)).toBe('quiet');
  });
});

describe('NewGroupForm', () => {
  it('draws the counter against the SAME number the input is capped at', () => {
    mount(
      <NewGroupForm name="Saturday" onNameChange={() => undefined} nameMaxLength={20} testID="f" />,
    );
    expect(text(byTestId('f-counter'))).toBe('8/20');
    const input = byTestId('f-name');
    expect(input.getAttribute('maxlength')).toBe('20');
  });

  it('names the photo picker — it draws a glyph and no text', () => {
    mount(
      <NewGroupForm
        name=""
        onNameChange={() => undefined}
        onPickPhoto={() => undefined}
        testID="f"
      />,
    );
    expect(byTestId('f-photo').getAttribute('aria-label')).toBe('Choose a group photo');
  });

  it('counts the members it was handed, and names each remove', () => {
    mount(
      <NewGroupForm
        name=""
        onNameChange={() => undefined}
        members={[{ id: 'a', name: 'Ana Restrepo' }]}
        onRemoveMember={() => undefined}
        testID="f"
      />,
    );
    expect(text(byTestId('f-members-title'))).toBe('1 member');
    expect(byTestId('f-remove-a').getAttribute('aria-label')).toBe('Remove Ana Restrepo');
  });
});

// ---------------------------------------------------------------------------
//  Members
// ---------------------------------------------------------------------------

describe('memberBadgeLabel', () => {
  it('badges owner and admin, and nobody else', () => {
    expect(memberBadgeLabel('owner', MEMBER_LABELS)).toBe('Owner');
    expect(memberBadgeLabel('admin', MEMBER_LABELS)).toBe('Admin');
    expect(memberBadgeLabel('member', MEMBER_LABELS)).toBeUndefined();
    expect(memberBadgeLabel(undefined, MEMBER_LABELS)).toBeUndefined();
    expect(memberBadgeLabel('owner', MEMBER_LABELS, 'Creator')).toBe('Creator');
  });
});

describe('Members composed with the shared List', () => {
  it('keeps roles visible and in the accessible row name', () => {
    mount(
      <List
        items={[
          {
            id: 'ana',
            label: 'Ana Restrepo, Owner',
            title: 'Ana Restrepo',
            trailing: <Badge content="Owner" tone="warning" />,
            onPress: () => {},
          },
        ]}
        testID="members"
      />,
    );
    expect(container.textContent).toContain('Owner');
    expect(byTestId('members-ana-link').getAttribute('aria-label')).toBe('Ana Restrepo, Owner');
  });
  it('keeps caller controls separate from the row action', () => {
    const open = jest.fn(),
      remove = jest.fn();
    mount(
      <ListItem
        label="Ana"
        title="Ana"
        onPress={open}
        trailing={
          <button data-testid="remove" onClick={remove}>
            Remove
          </button>
        }
      />,
    );
    press(byTestId('remove'));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });
  it('preserves the supplied result set and controlled search header', () => {
    mount(
      <List
        items={[
          { id: 'ana', label: 'Ana', title: 'Ana' },
          { id: 'kofi', label: 'Kofi', title: 'Kofi' },
        ]}
        header={<input data-testid="search" value="zzz" onChange={() => {}} />}
        testID="members"
      />,
    );
    expect(maybe('members-ana')).not.toBeNull();
    expect(maybe('members-kofi')).not.toBeNull();
    expect(maybe('search')).not.toBeNull();
  });
  it('routes a member press with the application identity', () => {
    const pressed: string[] = [];
    mount(
      <List
        items={[{ id: 'kofi', label: 'Kofi', title: 'Kofi', onPress: () => pressed.push('kofi') }]}
        testID="members"
      />,
    );
    press(byTestId('members-kofi-link'));
    expect(pressed).toEqual(['kofi']);
  });
  it('shows the caller empty state', () => {
    mount(<List items={[]} empty={<div data-testid="none" />} />);
    expect(maybe('none')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

describe('storyProgressFill', () => {
  it('fills everything before the current story and nothing after it', () => {
    expect([0, 1, 2, 3].map((bar) => storyProgressFill(bar, 2, 0.4))).toEqual([1, 1, 0.4, 0]);
  });

  it('clamps the current story, and treats a non-number as empty', () => {
    expect(storyProgressFill(0, 0, -1)).toBe(0);
    expect(storyProgressFill(0, 0, 4)).toBe(1);
    expect(storyProgressFill(0, 0, Number.NaN)).toBe(0);
  });

  it('answers honestly for an index outside the range, rather than throwing', () => {
    // A story expiring under the viewer renders one frame with a stale index.
    // Before the first story nothing is filled; past the last one everything is.
    expect(storyProgressFill(0, -1, 0.5)).toBe(0);
    expect(storyProgressFill(0, 9, 0.5)).toBe(1);
  });
});

describe('storyTapZone', () => {
  it('gives BACK the narrow third — forward is the common intent', () => {
    expect(storyTapZone(10, 300)).toBe('previous');
    expect(storyTapZone(99, 300)).toBe('previous');
    expect(storyTapZone(100, 300)).toBe('next');
    expect(storyTapZone(290, 300)).toBe('next');
    expect(storyTapZone(10, 0)).toBe('next');
  });
});

describe('StoryProgressBars', () => {
  it('draws one bar per story and names the strip by position', () => {
    mount(<StoryProgressBars count={5} index={1} progress={0.5} testID="s" />);
    expect(byTestId('s').getAttribute('aria-label')).toBe('Story 2 of 5');
    expect(maybe('s-bar-4')).not.toBeNull();
    expect(maybe('s-bar-5')).toBeNull();
  });

  it('runs its own clock only while uncontrolled and unpaused', () => {
    jest.useFakeTimers();
    try {
      const done: number[] = [];
      mount(
        <StoryProgressBars
          count={3}
          index={0}
          duration={1000}
          onComplete={() => done.push(1)}
          testID="s"
        />,
      );
      act(() => {
        jest.advanceTimersByTime(1200);
      });
      expect(done).toHaveLength(1);

      done.length = 0;
      mount(
        <StoryProgressBars
          count={3}
          index={0}
          duration={1000}
          paused
          onComplete={() => done.push(1)}
          testID="s"
        />,
      );
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(done).toHaveLength(0);

      done.length = 0;
      mount(
        <StoryProgressBars
          count={3}
          index={0}
          progress={0.2}
          duration={1000}
          onComplete={() => done.push(1)}
          testID="s"
        />,
      );
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(done).toHaveLength(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps ADVANCING under reduced motion — only the animation stops', () => {
    // A viewer that stops advancing under reduced motion strands the reader on
    // story one with nothing to tell them anything was meant to happen.
    motion.reduced = true;
    jest.useFakeTimers();
    try {
      const done: number[] = [];
      mount(
        <StoryProgressBars
          count={3}
          index={0}
          duration={800}
          onComplete={() => done.push(1)}
          testID="s"
        />,
      );
      act(() => {
        jest.advanceTimersByTime(900);
      });
      expect(done).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('StoryViewer', () => {
  const stories = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('gives both tap zones a real name, so a keyboard can reach them', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="Saoirse"
        time="2 h"
        onNext={() => undefined}
        onPrevious={() => undefined}
        testID="v"
      />,
    );
    expect(byTestId('v-previous').getAttribute('aria-label')).toBe('Previous story');
    expect(byTestId('v-next').getAttribute('aria-label')).toBe('Next story');
  });

  it('steps forward and back through the caller', () => {
    const events: string[] = [];
    mount(
      <StoryViewer
        stories={stories}
        index={1}
        name="Saoirse"
        time="2 h"
        onNext={() => events.push('next')}
        onPrevious={() => events.push('prev')}
        testID="v"
      />,
    );
    press(byTestId('v-next'));
    press(byTestId('v-previous'));
    expect(events).toEqual(['next', 'prev']);
  });

  it('passes the index straight to the strip', () => {
    mount(<StoryViewer stories={stories} index={2} name="S" time="2 h" testID="v" />);
    expect(byTestId('v-progress').getAttribute('aria-label')).toBe('Story 3 of 3');
  });

  it('makes the mute button a toggle with both spellings', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        muted
        onMutedChange={() => undefined}
        testID="v"
      />,
    );
    const mute = byTestId('v-mute');
    expect(mute.getAttribute('aria-pressed')).toBe('true');
    expect(mute.getAttribute('aria-label')).toBe('Unmute story');
  });

  it('draws the composer only with a change handler, and names the send button', () => {
    mount(<StoryViewer stories={stories} index={0} name="S" time="2 h" testID="v" />);
    expect(maybe('v-reply')).toBeNull();

    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        replyValue=""
        onReplyChange={() => undefined}
        onReplySend={() => undefined}
        testID="v"
      />,
    );
    expect(maybe('v-reply')).not.toBeNull();
    expect(byTestId('v-send').getAttribute('aria-label')).toBe('Send reply');
  });

  it('names each quick reaction by its emoji', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        reactions={['❤️', '🔥']}
        onReact={() => undefined}
        testID="v"
      />,
    );
    expect(byTestId('v-react-❤️').getAttribute('aria-label')).toBe('React with ❤️');
  });

  it('lets a caller replace the composer entirely', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        onReplyChange={() => undefined}
        composer={<div data-testid="mine" />}
        testID="v"
      />,
    );
    expect(maybe('v-reply')).toBeNull();
    expect(maybe('mine')).not.toBeNull();
  });
});
