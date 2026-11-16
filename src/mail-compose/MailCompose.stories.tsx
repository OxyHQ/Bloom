import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { Button } from '../button';
import { EmptyState } from '../empty-state';
import { Textarea } from '../textarea';
import { NoteEditorToolbar } from '../note-editor';
import { RiBold } from '../icons/remix/RiBold';
import { RiItalic } from '../icons/remix/RiItalic';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field';
import { Text } from '../typography';
import { MailComposeHeader } from './MailComposeHeader';
import { MailComposeSurface } from './MailComposeSurface';
import { MailRecipientField } from './MailRecipientField';
import type { MailRecipient, MailRecipientSuggestion } from './types';

const meta: Meta = {
  id: 'blocks-mail-mail-compose',
  title: 'Patterns/Mail/Mail Compose',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented addresses
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const CONTACTS: MailRecipientSuggestion[] = [
  {
    id: 'mireia',
    name: 'Mireia Solans',
    address: 'mireia@vallnit.example',
    avatar: face('mireia'),
  },
  { id: 'pere', name: 'Pere Aguiló', address: 'pere@vallnit.example', avatar: face('pere') },
  { id: 'nuria', name: 'Nuria Palau', address: 'nuria@vallnit.example', avatar: face('nuria') },
];

const TO: MailRecipient[] = [
  {
    id: 'mireia',
    name: 'Mireia Solans',
    address: 'mireia@vallnit.example',
    avatar: face('mireia'),
  },
  { id: 'pere', name: 'Pere Aguiló', address: 'pere@vallnit.example', avatar: face('pere') },
];

const ATTACHMENTS = [
  { id: 'f1', name: 'roof-survey.pdf', caption: 'roof-survey.pdf' },
  { id: 'f2', name: 'north-pitch.jpg', source: face('pitch') },
];

function useComposeState() {
  const [to, setTo] = useState<MailRecipient[]>(TO);
  const [cc, setCc] = useState<MailRecipient[]>([]);
  const [bcc, setBcc] = useState<MailRecipient[]>([]);
  const [subject, setSubject] = useState('Re: Roof survey — the tiles on the north pitch');
  const [query, setQuery] = useState('');
  const suggestions = useMemo(
    () =>
      query.length === 0
        ? []
        : CONTACTS.filter((contact) =>
            `${contact.name ?? ''} ${contact.address}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
          ),
    [query],
  );
  return { to, setTo, cc, setCc, bcc, setBcc, subject, setSubject, query, setQuery, suggestions };
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

function ComposeDemo({
  variant = 'docked',
  initiallyMinimized = false,
}: {
  variant?: 'docked' | 'sheet';
  initiallyMinimized?: boolean;
}) {
  const state = useComposeState();
  const [minimized, setMinimized] = useState(initiallyMinimized);
  const [expanded, setExpanded] = useState(false);
  const [closed, setClosed] = useState<string | null>(null);
  const [body, setBody] = useState(
    'Thanks both — Thursday works. I will leave the side gate open and put the ladder out.',
  );
  const [attachments, setAttachments] = useState(ATTACHMENTS);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const addRecipient = (field: 'to' | 'cc' | 'bcc', recipient: MailRecipient) => {
    const current = state[field];
    const update = field === 'to' ? state.setTo : field === 'cc' ? state.setCc : state.setBcc;
    if (!current.some((item) => item.address === recipient.address))
      update([...current, recipient]);
    state.setQuery('');
  };
  if (closed)
    return (
      <EmptyState
        title={closed}
        action={{ label: 'Open composer', onPress: () => setClosed(null) }}
      />
    );
  return (
    <View
      style={{
        width: '100%',
        maxWidth: expanded || variant === 'sheet' ? undefined : 620,
        height: minimized ? undefined : 640,
      }}
    >
      <MailComposeSurface
        variant={expanded ? 'sheet' : variant}
        minimized={minimized}
        onMinimizedChange={setMinimized}
        onExpand={() => {
          setMinimized(false);
          setExpanded(true);
        }}
        onClose={() => setClosed('Draft closed')}
        onSend={() => {
          fn().mockName('Compose.onSend')({
            to: state.to,
            cc: state.cc,
            bcc: state.bcc,
            subject: state.subject,
            body,
            attachments,
          });
          setClosed('Message submitted in demo');
        }}
        sendDisabled={state.to.length === 0 || state.to.some((recipient) => recipient.invalid)}
        onAttach={() =>
          setAttachments((current) => [
            ...current,
            {
              id: `file-${current.length + 1}`,
              name: `attachment-${current.length + 1}.pdf`,
              caption: 'Sample attachment',
            },
          ])
        }
        onDiscard={() => {
          setBody('');
          setAttachments([]);
          state.setSubject('');
          setClosed('Draft discarded');
        }}
        attachments={attachments}
        onAttachmentRemove={(id) =>
          setAttachments((current) => current.filter((file) => file.id !== id))
        }
        toolbar={
          <NoteEditorToolbar
            accessibilityLabel="Message formatting"
            actions={[
              {
                key: 'bold',
                label: 'Bold',
                icon: RiBold,
                active: bold,
                onPress: () => setBold((value) => !value),
              },
              {
                key: 'italic',
                label: 'Italic',
                icon: RiItalic,
                active: italic,
                onPress: () => setItalic((value) => !value),
              },
            ]}
          />
        }
        footer={
          expanded ? (
            <Button appearance="plain" onPress={() => setExpanded(false)}>
              Dock composer
            </Button>
          ) : undefined
        }
        header={
          <MailComposeHeader
            to={state.to}
            onToChange={state.setTo}
            cc={state.cc}
            onCcChange={state.setCc}
            bcc={state.bcc}
            onBccChange={state.setBcc}
            subject={state.subject}
            onSubjectChange={state.setSubject}
            query={state.query}
            onQueryChange={state.setQuery}
            suggestions={state.suggestions}
            onSuggestionPress={addRecipient}
            onQuerySubmit={(field, value) =>
              addRecipient(field, {
                id: value,
                address: value,
                invalid: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
              })
            }
            testID={`${variant}-header`}
          />
        }
        testID={initiallyMinimized ? 'minimized' : variant}
      >
        <Textarea
          accessibilityLabel="Message body"
          value={body}
          onChangeText={setBody}
          rows={6}
          resize="none"
          style={{ flex: 1, padding: 16 }}
          inputStyle={{ fontWeight: bold ? '700' : '400', fontStyle: italic ? 'italic' : 'normal' }}
        />
      </MailComposeSurface>
    </View>
  );
}

export const DockedPanel: Story = { render: () => <ComposeDemo /> };
export const MinimizedPanel: Story = { render: () => <ComposeDemo initiallyMinimized /> };
export const Sheet: Story = { render: () => <ComposeDemo variant="sheet" /> };

export const RecipientStates: Story = {
  render: () => {
    const [one, setOne] = useState<MailRecipient[]>(TO);
    const [bad, setBad] = useState<MailRecipient[]>([
      ...TO,
      { id: 'typo', address: 'nuria@@vallnit', invalid: true },
    ]);
    const [query, setQuery] = useState('n');
    return (
      <View style={{ width: 520, maxWidth: '100%', gap: 24, padding: 16 }}>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-semibold">Rest, with suggestions</Text>
          <MailRecipientField
            label="To"
            recipients={one}
            onRecipientsChange={setOne}
            value={query}
            onChangeText={setQuery}
            suggestions={CONTACTS.filter((c) =>
              (c.name ?? c.address).toLocaleLowerCase().includes(query.toLocaleLowerCase()),
            )}
            onSuggestionPress={(s) => {
              setOne([...one, { ...s }]);
              setQuery('');
            }}
            testID="rf-rest"
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-semibold">One address rejected</Text>
          <MailRecipientField
            label="To"
            recipients={bad}
            onRecipientsChange={setBad}
            testID="rf-invalid"
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-semibold">Inside a disabled Field with an error</Text>
          <Field label="Recipients" error="Add at least one recipient" disabled>
            <MailRecipientField
              label="To"
              recipients={[]}
              onRecipientsChange={fn().mockName('onRecipientsChange')}
              testID="rf-field"
            />
          </Field>
        </View>
      </View>
    );
  },
};
