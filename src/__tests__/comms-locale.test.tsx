/**
 * @jest-environment jsdom
 *
 * The comms families — avatar, call-ui, mail-compose, mail-thread, mail-list,
 * note-editor, note-card — speak the locale (`LocaleProvider`, which
 * `BloomProvider locale` mounts), count in the language's own plural forms,
 * and still let a caller's `labels` / `strings` / `*Label` props win.
 *
 * Rendered through the REAL react-native-web, as each family's own suite is,
 * so the assertions read the emitted names and text.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { within } from '@testing-library/dom';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Avatar } from '../avatar';
import { LABELS, labels } from '../shapes';
import { CallControls, CallHistoryRow, GroupCallBar, IncomingCallBanner } from '../call-ui';
import { CALL_STATUS_LABELS } from '../call-ui/shared';
import { LocaleProvider } from '../locale';
import { MailComposeSurface } from '../mail-compose';
import { MAIL_COMPOSE_MESSAGES } from '../mail-compose/messages';
import { MailList, MailSelectionBar } from '../mail-list';
import { MAIL_LIST_MESSAGES } from '../mail-list/messages';
import { groupMailByDay } from '../mail-list/shared';
import { MailThread } from '../mail-thread';
import { MAIL_THREAD_MESSAGES } from '../mail-thread/messages';
import type { MailThreadMessage } from '../mail-thread/types';
import { NoteCard } from '../note-card';
import { NOTE_CARD_MESSAGES } from '../note-card/messages';
import { NoteEditorHeader } from '../note-editor';
import { NOTE_EDITOR_MESSAGES } from '../note-editor/messages';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mountIn(locale: string | undefined, ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  });
  return within(container);
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

describe('avatar', () => {
  it('draws the live badge in the locale, and liveLabel still wins', () => {
    expect(mountIn('es', <Avatar name="Ana" size={56} live />).getByText('EN VIVO')).toBeTruthy();
    expect(mountIn('es', <Avatar name="Ana" size={56} live liveLabel="YA" />).getByText('YA')).toBeTruthy();
    expect(mountIn(undefined, <Avatar name="Ana" size={56} live />).getByText('LIVE')).toBeTruthy();
  });

  it("names the shapes in the locale's words, in the same order", () => {
    const es = labels('es');
    expect(es.map((row) => row.name)).toEqual(LABELS.map((row) => row.name));
    expect(es.find((row) => row.name === 'heart')?.label).toBe('Corazón');
    expect(es.find((row) => row.name === '4-leaf-clover')?.label).toBe('Trébol de 4 hojas');
    expect(LABELS.find((row) => row.name === '12-sided-cookie')?.label).toBe('12-Sided Cookie');
  });
});

describe('call-ui', () => {
  it('names the controls in the locale, and labels still win', () => {
    const view = mountIn('es', <CallControls muted={false} onMutedChange={() => undefined} onEndCall={() => undefined} testID="c" />);
    expect(view.getByLabelText('Silenciar micrófono')).toBeTruthy();
    expect(view.getByLabelText('Finalizar llamada')).toBeTruthy();
    act(() => root.render(<div />));
    expect(
      mountIn('es', <CallControls muted onMutedChange={() => undefined} labels={{ unmute: 'Hablar' }} testID="c" />).getByLabelText(
        'Hablar',
      ),
    ).toBeTruthy();
  });

  it('draws the group bar, the incoming banner and the history row in the locale', () => {
    expect(mountIn('de', <GroupCallBar title="Team" onJoin={() => undefined} />).getByText('Beitreten')).toBeTruthy();
    act(() => root.render(<div />));
    expect(mountIn('fr', <IncomingCallBanner name="Ana" mode="video" />).getByText('Appel vidéo entrant')).toBeTruthy();
    act(() => root.render(<div />));
    expect(
      mountIn('ja', <CallHistoryRow name="Ana" direction="missed" meta="18:40" onCallBack={() => undefined} />).getByLabelText(
        'Anaにかけ直す',
      ),
    ).toBeTruthy();
  });

  it('keeps the exported English constants English', () => {
    expect(CALL_STATUS_LABELS.ended).toBe('Call ended');
  });
});

describe('mail-compose', () => {
  it('titles the surface in the locale, and strings still win', () => {
    expect(mountIn('es', <MailComposeSurface variant="docked" testID="s" />).getByText('Mensaje nuevo')).toBeTruthy();
    act(() => root.render(<div />));
    expect(
      mountIn('es', <MailComposeSurface variant="docked" strings={{ title: 'Borrador' }} testID="s" />).getByText('Borrador'),
    ).toBeTruthy();
  });

  it('removes a recipient with a phrase, not a glued word', () => {
    expect(MAIL_COMPOSE_MESSAGES.de.removeRecipient('Ana')).toBe('Ana entfernen');
    expect(MAIL_COMPOSE_MESSAGES.ja.removeRecipient('Ana')).toBe('Anaを削除');
  });
});

describe('mail-thread', () => {
  const message = (id: string): MailThreadMessage => ({
    id,
    sender: { name: 'Mireia Solans', address: 'mireia@example.com' },
    to: [{ name: 'Me', address: 'me@example.com' }],
    time: `${id}-time`,
    preview: `${id}-preview`,
    children: <span>{id} body</span>,
  });
  const six = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map(message);

  it('folds the middle behind a translated, pluralised control', () => {
    mountIn('ru', <MailThread messages={six} testID="t" />);
    expect(byTestId('t-earlier').getAttribute('aria-label')).toBe('3 предыдущих сообщения');
    expect(MAIL_THREAD_MESSAGES.ru.earlierMessages(5)).toBe('5 предыдущих сообщений');
    expect(MAIL_THREAD_MESSAGES.ru.earlierMessages(21)).toBe('21 предыдущее сообщение');
  });

  it('lets strings win over the locale', () => {
    mountIn('ru', <MailThread messages={six} strings={{ earlierMessages: (n) => `+${n}` }} testID="t" />);
    expect(byTestId('t-earlier').getAttribute('aria-label')).toBe('+3');
  });
});

describe('mail-list', () => {
  it('draws the empty state and names the list in the locale; accessibilityLabel still wins', () => {
    const view = mountIn('it', <MailList mails={[]} testID="l" />);
    expect(view.getByText('Nessun elemento')).toBeTruthy();
    expect(byTestId('l').getAttribute('aria-label')).toBe('Posta');
    act(() => root.render(<div />));
    mountIn('it', <MailList mails={[]} accessibilityLabel="Posta in arrivo" testID="l" />);
    expect(byTestId('l').getAttribute('aria-label')).toBe('Posta in arrivo');
  });

  it("counts the selection in the language's plural", () => {
    mountIn('fr', <MailSelectionBar count={1} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-count').textContent).toBe('1 sélectionné');
    act(() => root.render(<div />));
    mountIn('fr', <MailSelectionBar count={3} total={4} onSelectAll={() => undefined} testID="b" />);
    expect(byTestId('b-count').textContent).toBe('3 sélectionnés');
    expect(MAIL_LIST_MESSAGES.ar.threadCount(2)).toBe('رسالتان');
  });

  it('names the day buckets and dates in the locale given', () => {
    const now = new Date(2026, 8, 28, 12).getTime();
    const day = 86_400_000;
    const sections = groupMailByDay(
      [
        { id: 'a', sender: { name: 'A' }, subject: 'a', date: now },
        { id: 'b', sender: { name: 'B' }, subject: 'b', date: now - day },
        { id: 'c', sender: { name: 'C' }, subject: 'c', date: now - 10 * day },
      ],
      { now, locale: 'es' },
    );
    expect(sections.map((section) => section.title)).toEqual(['Hoy', 'Ayer', '18 sept']);
    expect(groupMailByDay([{ id: 'a', sender: { name: 'A' }, subject: 'a', date: now }], { now })[0]?.title).toBe('Today');
  });

  it("hands the date formatter the bucket's LOCAL midnight, so no time zone shifts it a day", () => {
    // A UTC-midnight Date is the previous evening west of UTC, where a local
    // formatter printed the day before. Asserted as local midnight of the same
    // calendar day, which holds in whatever zone the suite runs.
    const now = new Date(2026, 8, 28, 12).getTime();
    const seen: Date[] = [];
    groupMailByDay(
      [
        { id: 'a', sender: { name: 'A' }, subject: 'a', date: now },
        { id: 'c', sender: { name: 'C' }, subject: 'c', date: new Date(2026, 8, 18, 9).getTime() },
      ],
      { now, formatDate: (date) => (seen.push(date), 'x') },
    );
    expect(seen.map((d) => [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()])).toEqual([[2026, 8, 18, 0, 0]]);
  });
});

describe('note-editor', () => {
  it("draws the placeholder and the word count in the locale's plural; labels still win", () => {
    mountIn('ru', <NoteEditorHeader title="" wordCount={2} testID="h" />);
    expect(byTestId('h-title').getAttribute('placeholder')).toBe('Без названия');
    expect(byTestId('h-words').textContent).toBe('2 слова');
    act(() => root.render(<div />));
    mountIn('ru', <NoteEditorHeader title="" wordCount={5} labels={{ words: (n) => `${n} w` }} placeholder="Новая" testID="h" />);
    expect(byTestId('h-words').textContent).toBe('5 w');
    expect(byTestId('h-title').getAttribute('placeholder')).toBe('Новая');
    expect(NOTE_EDITOR_MESSAGES.ru.header.words(11)).toBe('11 слов');
  });
});

describe('note-card', () => {
  it('composes its name in the locale, and labels still win', () => {
    mountIn('pt', <NoteCard title="Porto" pinned meta={{ attachments: 1 }} onPress={() => undefined} testID="n" />);
    expect(byTestId('n').getAttribute('aria-label')).toBe('Porto, Fixada, 1 anexo');
    act(() => root.render(<div />));
    mountIn('pt', <NoteCard title="Porto" pinned labels={{ pinned: 'No topo' }} onPress={() => undefined} testID="n" />);
    expect(byTestId('n').getAttribute('aria-label')).toBe('Porto, No topo');
    expect(NOTE_CARD_MESSAGES.fr.attachments(0)).toBe('0 pièce jointe');
    expect(NOTE_CARD_MESSAGES.ar.attachments(11)).toBe('11 مرفقًا');
  });
});
