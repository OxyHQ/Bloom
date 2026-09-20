/**
 * @jest-environment jsdom
 *
 * `mail-thread`, through the REAL react-native-web.
 *
 * The two things this family claims that only the rendered DOM can show are the
 * disclosure's ATTRIBUTES (react-native-web drops `accessibilityState`, so a
 * message that spelled only the native form would announce no state at all) and
 * the geometry the collapsed and the expanded header SHARE, which is the whole
 * reason opening a message does not shift the stack.
 *
 * `collapseThread`, `defaultExpandedIds` and `visibleAddresses` are asserted
 * directly — they are the arithmetic, and a rendered stack cannot tell which
 * three messages survived on purpose.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { MailAddressLine, MailMessage, MailQuoteToggle, MailThread } from '../mail-thread';
import {
  DEFAULT_MAIL_THREAD_STRINGS,
  MAIL_BODY_INSET,
  MAIL_THREAD_GEOMETRY,
  addressName,
  collapseThread,
  defaultExpandedIds,
  visibleAddresses,
} from '../mail-thread/shared';
import type { MailAddress, MailThreadMessage } from '../mail-thread/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
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

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const PEOPLE: Record<string, MailAddress> = {
  mireia: { name: 'Mireia Solans', address: 'mireia@vallnit.example' },
  pere: { name: 'Pere Aguiló', address: 'pere@vallnit.example' },
  nuria: { name: 'Nuria Palau', address: 'nuria@vallnit.example' },
  bastia: { address: 'bastia@tordera.example' },
  me: { name: 'You', address: 'you@vallnit.example' },
};

const ALL = [PEOPLE.mireia!, PEOPLE.pere!, PEOPLE.nuria!, PEOPLE.bastia!, PEOPLE.me!];

const message = (id: string): MailThreadMessage => ({
  id,
  sender: PEOPLE.mireia!,
  to: [PEOPLE.me!],
  time: `${id}-time`,
  date: `${id}-date`,
  preview: `${id}-preview`,
  children: <span data-testid={`${id}-body-content`}>{id} body</span>,
});

const SIX = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map(message);

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('addressName and visibleAddresses', () => {
  it('falls back to the address when there is no name', () => {
    expect(addressName(PEOPLE.mireia!)).toBe('Mireia Solans');
    expect(addressName(PEOPLE.bastia!)).toBe('bastia@tordera.example');
    expect(addressName({ name: '', address: 'x@y.example' })).toBe('x@y.example');
  });

  it('counts NAMES, not chips — the "+N more" is beside them', () => {
    expect(visibleAddresses(ALL, 3)).toEqual({ shown: ALL.slice(0, 3), overflow: 2 });
    expect(visibleAddresses(ALL, 5)).toEqual({ shown: ALL, overflow: 0 });
    expect(visibleAddresses(ALL, 0)).toEqual({ shown: ALL, overflow: 0 });
  });
});

describe('collapseThread', () => {
  it('folds the MIDDLE, keeping the first and the last two', () => {
    const entries = collapseThread(SIX, 4);
    expect(entries.map((e) => (e.kind === 'message' ? e.message.id : `fold:${e.count}`))).toEqual([
      'm1',
      'fold:3',
      'm5',
      'm6',
    ]);
  });

  it('never folds when the threshold is 0 or the thread is short', () => {
    expect(collapseThread(SIX, 0)).toHaveLength(6);
    expect(collapseThread(SIX.slice(0, 4), 4)).toHaveLength(4);
  });

  it('never reorders, and never hides fewer than one message behind a button', () => {
    const entries = collapseThread(SIX, 4);
    const fold = entries.find((entry) => entry.kind === 'collapsed');
    expect(fold?.kind === 'collapsed' && fold.ids).toEqual(['m2', 'm3', 'm4']);
  });
});

describe('defaultExpandedIds', () => {
  it('opens the newest and only the newest', () => {
    expect(defaultExpandedIds(SIX)).toEqual(['m6']);
    expect(defaultExpandedIds([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  MailMessage, rendered
// ---------------------------------------------------------------------------

describe('MailMessage', () => {
  it('spells the disclosure in BOTH vocabularies and names it after the sender', () => {
    mount(<MailMessage {...message('m1')} testID="m" />);
    const toggle = byTestId('m-toggle');
    expect(toggle.getAttribute('role')).toBe('button');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe(
      `${DEFAULT_MAIL_THREAD_STRINGS.expand}: Mireia Solans`,
    );
  });

  it('renders the body slot only while open, and flips the disclosure', () => {
    mount(<MailMessage {...message('m1')} testID="m" />);
    expect(maybe('m-body')).toBeNull();
    expect(maybe('m1-body-content')).toBeNull();

    click(byTestId('m-toggle'));
    expect(byTestId('m-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('m-toggle').getAttribute('aria-label')).toBe(
      `${DEFAULT_MAIL_THREAD_STRINGS.collapse}: Mireia Solans`,
    );
    expect(byTestId('m1-body-content').textContent).toBe('m1 body');
  });

  it('keeps the header padding identical in both states, so opening leaves no gap', () => {
    const read = () => {
      const header = byTestId('m-toggle').parentElement?.parentElement;
      if (!(header instanceof HTMLElement)) throw new Error('no header row');
      const style = getComputedStyle(header);
      return [style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight];
    };
    mount(<MailMessage {...message('m1')} testID="m" />);
    const collapsed = read();
    click(byTestId('m-toggle'));
    expect(read()).toEqual(collapsed);
    expect(collapsed[0]).toBe(`${MAIL_THREAD_GEOMETRY.paddingVertical}px`);
  });

  it('indents the body under the NAME, not under the avatar', () => {
    mount(<MailMessage {...message('m1')} defaultExpanded testID="m" />);
    expect(getComputedStyle(byTestId('m-body')).paddingLeft).toBe(`${MAIL_BODY_INSET}px`);
    expect(MAIL_BODY_INSET).toBeGreaterThan(MAIL_THREAD_GEOMETRY.paddingHorizontal);
  });

  it('shows the preview collapsed and the addresses open', () => {
    mount(<MailMessage {...message('m1')} to={ALL} testID="m" />);
    expect(byTestId('m-preview').textContent).toBe('m1-preview');
    expect(maybe('m-to')).toBeNull();

    click(byTestId('m-toggle'));
    expect(maybe('m-preview')).toBeNull();
    expect(byTestId('m-to-names').textContent).toBe(
      'Mireia Solans, Pere Aguiló, Nuria Palau',
    );
  });

  it('draws the time collapsed and the full date open', () => {
    mount(<MailMessage {...message('m1')} testID="m" />);
    expect(byTestId('m-time').textContent).toBe('m1-time');
    click(byTestId('m-toggle'));
    expect(byTestId('m-time').textContent).toBe('m1-date');
  });

  it('renders each reply only when the app can answer it', () => {
    mount(<MailMessage {...message('m1')} defaultExpanded onReply={() => undefined} testID="m" />);
    expect(maybe('m-reply')).not.toBeNull();
    expect(maybe('m-reply-all')).toBeNull();
    expect(maybe('m-forward')).toBeNull();
  });

  it('names an attachment chip with its size, and marks the collapsed row', () => {
    mount(
      <MailMessage
        {...message('m1')}
        attachments={[{ id: 'a1', name: 'survey.pdf', size: '1.2 MB' }]}
        testID="m"
      />,
    );
    expect(maybe('m-attachment-marker')).not.toBeNull();
    click(byTestId('m-toggle'));
    expect(byTestId('m-attachment-a1').getAttribute('aria-label')).toBe('survey.pdf · 1.2 MB');
  });
});

// ---------------------------------------------------------------------------
//  MailAddressLine and MailQuoteToggle
// ---------------------------------------------------------------------------

describe('MailAddressLine', () => {
  it('collapses the surplus into a control that reveals the rest in place', () => {
    mount(<MailAddressLine label="Cc" addresses={ALL} testID="cc" />);
    expect(byTestId('cc-names').textContent).toBe('Mireia Solans, Pere Aguiló, Nuria Palau');
    const more = byTestId('cc-more');
    expect(more.getAttribute('aria-label')).toBe(DEFAULT_MAIL_THREAD_STRINGS.moreAddresses(2));

    click(more);
    expect(byTestId('cc-names').textContent).toContain('bastia@tordera.example');
    expect(maybe('cc-more')).toBeNull();
  });

  it('draws no control when everyone fits, and nothing at all when empty', () => {
    mount(<MailAddressLine label="To" addresses={[PEOPLE.me!]} testID="to" />);
    expect(maybe('to-more')).toBeNull();

    act(() => root.render(<div />));
    mount(<MailAddressLine label="To" addresses={[]} testID="to" />);
    expect(maybe('to')).toBeNull();
  });
});

describe('MailQuoteToggle', () => {
  it('FLIPS its name with its state, and renders the content only while open', () => {
    mount(
      <MailQuoteToggle testID="q">
        <span data-testid="quoted">quoted</span>
      </MailQuoteToggle>,
    );
    const button = byTestId('q-button');
    expect(button.getAttribute('aria-label')).toBe(DEFAULT_MAIL_THREAD_STRINGS.showTrimmed);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(maybe('quoted')).toBeNull();

    click(button);
    expect(byTestId('q-button').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_THREAD_STRINGS.hideTrimmed,
    );
    expect(byTestId('quoted').textContent).toBe('quoted');
  });
});

// ---------------------------------------------------------------------------
//  MailThread, rendered
// ---------------------------------------------------------------------------

describe('MailThread', () => {
  it('opens the newest message and closes the rest', () => {
    mount(<MailThread messages={SIX} collapseAfter={0} testID="t" />);
    expect(byTestId('t-message-m6-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('t-message-m1-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('folds the middle behind one control and reveals every message on press', () => {
    mount(<MailThread messages={SIX} testID="t" />);
    expect(maybe('t-message-m3')).toBeNull();
    const earlier = byTestId('t-earlier');
    expect(earlier.getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_THREAD_STRINGS.earlierMessages(3),
    );

    click(earlier);
    expect(maybe('t-earlier')).toBeNull();
    for (const id of ['m2', 'm3', 'm4']) expect(maybe(`t-message-${id}`)).not.toBeNull();
  });

  it('reports every open id when one message is toggled', () => {
    const seen: string[][] = [];
    mount(
      <MailThread
        messages={SIX}
        collapseAfter={0}
        expandedIds={['m6']}
        onExpandedIdsChange={(ids) => seen.push(ids)}
        testID="t"
      />,
    );
    click(byTestId('t-message-m1-toggle'));
    expect(seen[seen.length - 1]?.sort()).toEqual(['m1', 'm6']);
  });

  it('draws the subject, its labels and the quick-reply slot', () => {
    mount(
      <MailThread
        subject="Roof survey"
        labels={[{ id: 'work', name: 'Work', tone: 'info' }]}
        messages={SIX.slice(0, 2)}
        quickReply={<span data-testid="reply-slot">reply</span>}
        testID="t"
      />,
    );
    expect(byTestId('t-subject').textContent).toBe('Roof survey');
    expect(byTestId('t-labels-work').textContent).toBe('Work');
    expect(byTestId('t-quick-reply').textContent).toBe('reply');
  });
});
