import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { MailComposeHeader } from './MailComposeHeader';
import { MailComposeSurface } from './MailComposeSurface';
import { MailRecipientField } from './MailRecipientField';
import type { MailRecipient, MailRecipientSuggestion } from './types';

const meta: Meta = {
  title: 'Blocks/Mail/Mail Compose',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented addresses
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const CONTACTS: MailRecipientSuggestion[] = [
  { id: 'mireia', name: 'Mireia Solans', address: 'mireia@vallnit.example', avatar: face('mireia') },
  { id: 'pere', name: 'Pere Aguiló', address: 'pere@vallnit.example', avatar: face('pere') },
  { id: 'nuria', name: 'Nuria Palau', address: 'nuria@vallnit.example', avatar: face('nuria') },
];

const TO: MailRecipient[] = [
  { id: 'mireia', name: 'Mireia Solans', address: 'mireia@vallnit.example', avatar: face('mireia') },
  { id: 'pere', name: 'Pere Aguiló', address: 'pere@vallnit.example', avatar: face('pere') },
];

const ATTACHMENTS = [
  { id: 'f1', name: 'roof-survey.pdf', caption: 'roof-survey.pdf' },
  { id: 'f2', name: 'north-pitch.jpg', source: face('pitch') },
];

/** A plain multi-line body. The real one is the app's editor; this is a slot filler. */
function BodyArea() {
  const theme = useTheme();
  const [value, setValue] = useState(
    'Thanks both — Thursday works. I will leave the side gate open and put the ladder out.',
  );
  return (
    <TextInput
      accessibilityLabel="Message body"
      multiline
      value={value}
      onChangeText={setValue}
      style={{
        ...TYPE_SCALE['body-regular'],
        color: theme.colors.text,
        flex: 1,
        minHeight: 120,
        padding: 16,
        borderWidth: 0,
        backgroundColor: 'transparent',
      }}
    />
  );
}

/** Stands in for `note-editor`'s `NoteEditorToolbar`, which owns this slot. */
function ToolbarSlot() {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16 }}>
      <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
        Formatting toolbar slot — NoteEditorToolbar goes here
      </Text>
    </View>
  );
}

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

export const DockedPanel: Story = {
  render: () => {
    const state = useComposeState();
    const [minimized, setMinimized] = useState(false);
    return (
      <View style={{ width: 520, maxWidth: '100%', height: 560 }}>
        <MailComposeSurface
          variant="docked"
          minimized={minimized}
          onMinimizedChange={setMinimized}
          onExpand={() => undefined}
          onClose={() => undefined}
          onSend={() => undefined}
          onAttach={() => undefined}
          onDiscard={() => undefined}
          attachments={ATTACHMENTS}
          onAttachmentRemove={() => undefined}
          toolbar={<ToolbarSlot />}
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
              onSuggestionPress={(field, suggestion) => {
                if (field === 'to') state.setTo([...state.to, { ...suggestion }]);
                state.setQuery('');
              }}
              onQuerySubmit={(field, value) => {
                if (field === 'to') {
                  state.setTo([...state.to, { id: value, address: value }]);
                }
                state.setQuery('');
              }}
              testID="docked-header"
            />
          }
          testID="docked"
        >
          <BodyArea />
        </MailComposeSurface>
      </View>
    );
  },
};

export const MinimizedPanel: Story = {
  render: () => (
    <View style={{ width: 420, maxWidth: '100%' }}>
      <MailComposeSurface
        variant="docked"
        title="Re: Roof survey"
        minimized
        onMinimizedChange={() => undefined}
        onExpand={() => undefined}
        onClose={() => undefined}
        testID="minimized"
      />
    </View>
  ),
};

export const PhoneSheet: Story = {
  render: () => {
    const state = useComposeState();
    const theme = useTheme();
    return (
      // In an app this is a `Dialog` in its sheet placement, or a `BottomSheet`
      // child. The surface draws no overlay of its own, which is why it can be.
      <View
        style={{
          width: 390,
          maxWidth: '100%',
          height: 640,
          backgroundColor: theme.colors.background,
        }}
      >
        <MailComposeSurface
          variant="sheet"
          onClose={() => undefined}
          onSend={() => undefined}
          onAttach={() => undefined}
          onDiscard={() => undefined}
          toolbar={<ToolbarSlot />}
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
              testID="sheet-header"
            />
          }
          testID="sheet"
        >
          <BodyArea />
        </MailComposeSurface>
      </View>
    );
  },
};

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
              onRecipientsChange={() => undefined}
              testID="rf-field"
            />
          </Field>
        </View>
      </View>
    );
  },
};
