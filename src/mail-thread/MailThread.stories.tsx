import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiFileImageLine } from '../icons/remix/RiFileImageLine';
import { RiFilePdf2Line } from '../icons/remix/RiFilePdf2Line';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailAddressLine } from './MailAddressLine';
import { MailMessage } from './MailMessage';
import { MailQuoteToggle } from './MailQuoteToggle';
import { MailThread } from './MailThread';
import type { MailAddress, MailThreadMessage } from './types';

const meta: Meta = {
  title: 'Blocks/Mail/Mail Thread',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented mail
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const PEOPLE: Record<string, MailAddress> = {
  mireia: { name: 'Mireia Solans', address: 'mireia@vallnit.example', avatar: face('mireia') },
  pere: { name: 'Pere Aguiló', address: 'pere@vallnit.example', avatar: face('pere') },
  nuria: { name: 'Nuria Palau', address: 'nuria@vallnit.example', avatar: face('nuria') },
  bastia: { name: 'Bastia Ferrers', address: 'bastia@tordera.example', avatar: face('bastia') },
  me: { name: 'You', address: 'you@vallnit.example', avatar: face('you') },
};

const EVERYONE = [PEOPLE.mireia!, PEOPLE.pere!, PEOPLE.nuria!, PEOPLE.bastia!, PEOPLE.me!];

function Body({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="body-regular" style={{ color: theme.colors.text }}>
      {children}
    </Text>
  );
}

function Quoted({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor: theme.colors.textSecondary,
        paddingLeft: 10,
      }}
    >
      <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
        {children}
      </Text>
    </View>
  );
}

const MESSAGES: MailThreadMessage[] = [
  {
    id: 'm1',
    sender: PEOPLE.mireia!,
    to: [PEOPLE.me!],
    date: '9 March, 10:04',
    time: '9 Mar',
    preview: 'The surveyor can come on the Tuesday or the Thursday, whichever suits.',
    children: (
      <Body>
        The surveyor can come on the Tuesday or the Thursday, whichever suits. He wants two
        hours and a ladder, and he says the north pitch is the only part he is worried about.
      </Body>
    ),
  },
  {
    id: 'm2',
    sender: PEOPLE.me!,
    to: [PEOPLE.mireia!],
    date: '9 March, 11:22',
    time: '9 Mar',
    preview: 'Thursday is better. I will leave the side gate open.',
    children: <Body>Thursday is better. I will leave the side gate open.</Body>,
  },
  {
    id: 'm3',
    sender: PEOPLE.pere!,
    to: [PEOPLE.mireia!, PEOPLE.me!],
    cc: EVERYONE,
    date: '11 March, 08:40',
    time: '11 Mar',
    preview: 'Adding everyone — we should decide about the shutters at the same time.',
    children: <Body>Adding everyone — we should decide about the shutters at the same time.</Body>,
  },
  {
    id: 'm4',
    sender: PEOPLE.nuria!,
    to: [PEOPLE.me!],
    date: '12 March, 16:15',
    time: '12 Mar',
    preview: 'The railing spacing on the drawing is 14cm, which is too wide.',
    children: <Body>The railing spacing on the drawing is 14cm, which is too wide.</Body>,
  },
  {
    id: 'm5',
    sender: PEOPLE.mireia!,
    to: [PEOPLE.me!, PEOPLE.pere!],
    cc: [PEOPLE.nuria!, PEOPLE.bastia!],
    date: '14 March, 14:02',
    time: '14:02',
    preview: 'Survey is back. Short version: we only need the north pitch done.',
    unread: true,
    starred: true,
    attachments: [
      { id: 'a1', name: 'roof-survey.pdf', size: '1.2 MB', icon: RiFilePdf2Line },
      { id: 'a2', name: 'north-pitch.jpg', size: '340 KB', icon: RiFileImageLine },
    ],
    children: (
      <Body>
        Survey is back and the short version is that we only need the north pitch done. Everything
        else has another ten years in it. The quote is in the attachment; I have asked for the
        scaffolding to be priced separately so we can compare it with Pere's.
      </Body>
    ),
    trimmed: <Quoted>On 12 March, Nuria Palau wrote: The railing spacing on the drawing…</Quoted>,
    onReply: () => undefined,
    onReplyAll: () => undefined,
    onForward: () => undefined,
  },
];

function Frame({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width, maxWidth: '100%', backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

export const Thread: Story = {
  render: () => {
    const [starred, setStarred] = useState(true);
    return (
      <Frame width={720}>
        <MailThread
          subject="Roof survey — the tiles on the north pitch"
          labels={[
            { id: 'work', name: 'Work', tone: 'info' },
            { id: 'house', name: 'House', tone: 'default' },
          ]}
          starred={starred}
          onStarredChange={setStarred}
          messages={MESSAGES}
          quickReply={
            <Button variant="secondary" size="small" onPress={() => undefined}>
              Reply to Mireia
            </Button>
          }
          testID="thread"
        />
      </Frame>
    );
  },
};

export const ThreadOnPhone: Story = {
  render: () => (
    <Frame width={390}>
      <MailThread
        subject="Roof survey — the tiles on the north pitch"
        labels={[{ id: 'work', name: 'Work', tone: 'info' }]}
        messages={MESSAGES}
        testID="thread-phone"
      />
    </Frame>
  ),
};

export const NoCollapse: Story = {
  render: () => (
    <Frame width={720}>
      <MailThread
        subject="Two messages, nothing to fold"
        messages={MESSAGES.slice(0, 2)}
        testID="thread-short"
      />
    </Frame>
  ),
};

export const Message: Story = {
  render: () => (
    <Frame width={640}>
      <View style={{ gap: 8, paddingTop: 12 }}>
        <Text variant="caption-1-semibold">Collapsed</Text>
        <MailMessage {...MESSAGES[0]!} testID="msg-collapsed" />
        <Text variant="caption-1-semibold">Collapsed, unread, with an attachment</Text>
        <MailMessage {...MESSAGES[4]!} testID="msg-collapsed-unread" />
        <Text variant="caption-1-semibold">Expanded</Text>
        <MailMessage
          {...MESSAGES[4]!}
          defaultExpanded
          onStarredChange={() => undefined}
          testID="msg-expanded"
        />
      </View>
    </Frame>
  ),
};

export const AddressLine: Story = {
  render: () => (
    <Frame width={480}>
      <View style={{ gap: 10, padding: 16 }}>
        <MailAddressLine label="To" addresses={[PEOPLE.me!]} testID="to-one" />
        <MailAddressLine label="Cc" addresses={EVERYONE} testID="cc-overflow" />
        <MailAddressLine label="Cc" addresses={EVERYONE} expanded testID="cc-open" />
      </View>
    </Frame>
  ),
};

export const TrimmedContent: Story = {
  render: () => (
    <Frame width={480}>
      <View style={{ gap: 12, padding: 16 }}>
        <Body>Sounds good, see you Thursday.</Body>
        <MailQuoteToggle testID="quote">
          <Quoted>
            On 9 March, Mireia Solans wrote: The surveyor can come on the Tuesday or the
            Thursday, whichever suits.
          </Quoted>
        </MailQuoteToggle>
      </View>
    </Frame>
  ),
};
