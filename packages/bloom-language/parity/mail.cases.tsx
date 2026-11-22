import { Button } from '@oxy.so/bloom/button';
import { RiBold, RiFilePdf2Line, RiItalic, RiListUnordered, RiLink } from '@oxy.so/bloom/icons';
import { MailComposeSurface, MailRecipientField } from '@oxy.so/bloom/mail-compose';
import { MailMessage, MailQuoteToggle, MailThread } from '@oxy.so/bloom/mail-thread';
import { NoteEditorToolbar } from '@oxy.so/bloom/note-editor';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const setRecipients = (_recipients: unknown[]) => {};
const setText = (_text: string) => {};
const setExpanded = (_expanded: boolean) => {};

const MIREIA = { name: 'Mireia Solans', address: 'mireia@vallnit.example' };
const PERE = { name: 'Pere Aguiló', address: 'pere@vallnit.example' };
const NURIA = { name: 'Nuria Palau', address: 'nuria@vallnit.example' };

const RECIPIENTS = [
  { id: 'r1', ...MIREIA },
  { id: 'r2', address: 'not-an-address', invalid: true },
];
const SUGGESTIONS = [{ id: 's1', ...PERE }];

const MESSAGES = [
  {
    id: 'm1',
    sender: MIREIA,
    to: [PERE],
    date: 'Mon 3',
    time: '09:12',
    preview: 'The plan for spring',
  },
  {
    id: 'm2',
    sender: PERE,
    to: [MIREIA],
    cc: [NURIA],
    date: 'Mon 3',
    time: '10:40',
    preview: 'Sounds right',
    attachments: [{ id: 'a1', name: 'plan.pdf', size: '120 KB', icon: RiFilePdf2Line }],
  },
  {
    id: 'm3',
    sender: NURIA,
    to: [MIREIA, PERE],
    date: 'Tue 4',
    time: '08:05',
    preview: 'One question',
    unread: true,
  },
];

const ACTIONS = [
  { key: 'bold', label: 'Bold', icon: RiBold, onPress: press, active: true },
  { key: 'italic', label: 'Italic', icon: RiItalic, onPress: press },
  { key: 'list', label: 'List', icon: RiListUnordered, onPress: press, disabled: true },
  { key: 'link', label: 'Link', icon: RiLink, onPress: press, alwaysVisible: true },
];

const compose: ParityCase[] = [
  ...ENUMS.mailComposeStyle.map((variant) => ({
    name: `MailComposeSurface ${variant}`,
    language: () =>
      toElement(
        L.MailComposeSurface(L.Text('Hello'), {
          title: 'New message',
          onSend: press,
          onClose: press,
        }).style(variant),
      ),
    bloom: () => (
      <MailComposeSurface variant={variant} title="New message" onSend={press} onClose={press}>
        <Text>Hello</Text>
      </MailComposeSurface>
    ),
  })),
  {
    name: 'MailComposeSurface sending, its header, toolbar and footer, named',
    language: () =>
      toElement(
        L.MailComposeSurface(L.Text('Hello'), {
          onSend: press,
          onAttach: press,
          onDiscard: press,
          header: L.Text('To Mireia'),
          toolbar: L.Text('Formatting'),
          footer: L.Text('Saved'),
        })
          .loading()
          .label('Reply'),
      ),
    bloom: () => (
      <MailComposeSurface
        onSend={press}
        onAttach={press}
        onDiscard={press}
        header={<Text>To Mireia</Text>}
        toolbar={<Text>Formatting</Text>}
        footer={<Text>Saved</Text>}
        sending
        accessibilityLabel="Reply"
      >
        <Text>Hello</Text>
      </MailComposeSurface>
    ),
  },
  {
    name: 'MailComposeSurface minimized, send disabled',
    language: () =>
      toElement(
        L.MailComposeSurface(undefined, { title: 'Draft', minimized: true, sendDisabled: true }),
      ),
    bloom: () => <MailComposeSurface title="Draft" minimized sendDisabled />,
  },
  {
    name: 'MailRecipientField',
    language: () => toElement(L.MailRecipientField([RECIPIENTS, setRecipients], { label: 'To' })),
    bloom: () => (
      <MailRecipientField label="To" recipients={RECIPIENTS} onRecipientsChange={setRecipients} />
    ),
  },
  {
    name: 'MailRecipientField typing, suggestions, a trailing child, named',
    language: () =>
      toElement(
        L.MailRecipientField([RECIPIENTS, setRecipients], {
          label: 'Cc',
          value: 'pe',
          onChangeText: setText,
          suggestions: SUGGESTIONS,
          placeholder: 'Add people',
          trailing: L.Button(L.Text('Bcc')).style('plain').onPress(press),
        }).label('Copies'),
      ),
    bloom: () => (
      <MailRecipientField
        label="Cc"
        recipients={RECIPIENTS}
        onRecipientsChange={setRecipients}
        value="pe"
        onChangeText={setText}
        suggestions={SUGGESTIONS}
        placeholder="Add people"
        trailing={
          <Button appearance="plain" onPress={press}>
            Bcc
          </Button>
        }
        accessibilityLabel="Copies"
      />
    ),
  },
  {
    name: 'MailRecipientField disabled, invalid',
    language: () =>
      toElement(
        L.MailRecipientField([[], setRecipients], { label: 'To', invalid: true }).disabled(),
      ),
    bloom: () => (
      <MailRecipientField
        label="To"
        recipients={[]}
        onRecipientsChange={setRecipients}
        invalid
        disabled
      />
    ),
  },
];

const thread: ParityCase[] = [
  {
    name: 'MailMessage collapsed',
    language: () =>
      toElement(L.MailMessage(MIREIA, L.Text('The plan'), { date: 'Mon 3', preview: 'The plan' })),
    bloom: () => (
      <MailMessage sender={MIREIA} date="Mon 3" preview="The plan">
        <Text>The plan</Text>
      </MailMessage>
    ),
  },
  {
    name: 'MailMessage expanded, its trimmed quote and menu, starred',
    language: () =>
      toElement(
        L.MailMessage(PERE, L.Text('Sounds right'), {
          to: [MIREIA],
          cc: [NURIA],
          date: 'Mon 3',
          time: '10:40',
          defaultExpanded: true,
          starred: true,
          onStarredChange: setExpanded,
          attachments: MESSAGES[1]!.attachments,
          trimmed: L.Text('> The plan'),
          menu: L.Text('More'),
          onReply: press,
          onReplyAll: press,
          onForward: press,
        }),
      ),
    bloom: () => (
      <MailMessage
        sender={PERE}
        to={[MIREIA]}
        cc={[NURIA]}
        date="Mon 3"
        time="10:40"
        defaultExpanded
        starred
        onStarredChange={setExpanded}
        attachments={MESSAGES[1]!.attachments}
        trimmed={<Text>{'> The plan'}</Text>}
        menu={<Text>More</Text>}
        onReply={press}
        onReplyAll={press}
        onForward={press}
      >
        <Text>Sounds right</Text>
      </MailMessage>
    ),
  },
  {
    name: 'MailThread',
    language: () => toElement(L.MailThread(MESSAGES, { subject: 'Spring plan' })),
    bloom: () => <MailThread messages={MESSAGES} subject="Spring plan" />,
  },
  {
    name: 'MailThread labelled, starred, collapsed after one, a gap, a quick reply, named',
    language: () =>
      toElement(
        L.MailThread(MESSAGES, {
          subject: 'Spring plan',
          labels: [{ id: 'l1', name: 'Work', tone: 'info' as const }],
          starred: true,
          collapseAfter: 1,
          messageGap: 'md',
          quickReply: L.Button(L.Text('Reply')).onPress(press),
          header: L.Text('Inbox'),
        }).label('Thread'),
      ),
    bloom: () => (
      <MailThread
        messages={MESSAGES}
        subject="Spring plan"
        labels={[{ id: 'l1', name: 'Work', tone: 'info' as const }]}
        starred
        collapseAfter={1}
        messageGap={12}
        quickReply={<Button onPress={press}>Reply</Button>}
        header={<Text>Inbox</Text>}
        accessibilityLabel="Thread"
      />
    ),
  },
  ...[false, true].map((expanded) => ({
    name: `MailQuoteToggle ${expanded ? 'open' : 'folded'}`,
    language: () =>
      toElement(
        L.MailQuoteToggle(L.Text('> Earlier'), { expanded, onExpandedChange: setExpanded }),
      ),
    bloom: () => (
      <MailQuoteToggle expanded={expanded} onExpandedChange={setExpanded}>
        <Text>{'> Earlier'}</Text>
      </MailQuoteToggle>
    ),
  })),
];

const notes: ParityCase[] = [
  {
    name: 'NoteEditorToolbar',
    language: () => toElement(L.NoteEditorToolbar('Formatting', ACTIONS)),
    bloom: () => <NoteEditorToolbar actions={ACTIONS} accessibilityLabel="Formatting" />,
  },
  ...ENUMS.noteToolbarSize.map((size) => ({
    name: `NoteEditorToolbar ${size}, disabled, its words`,
    language: () =>
      toElement(
        L.NoteEditorToolbar('Formatting', ACTIONS, { labels: { more: 'More' } })
          .size(size)
          .disabled(),
      ),
    bloom: () => (
      <NoteEditorToolbar
        actions={ACTIONS}
        accessibilityLabel="Formatting"
        labels={{ more: 'More' }}
        size={size}
        disabled
      />
    ),
  })),
];

export const MAIL_CASES: ParityCase[] = [...compose, ...thread, ...notes];
