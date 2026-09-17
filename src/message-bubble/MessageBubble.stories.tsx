import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiPushpinLine } from '../icons/remix';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallSummaryRow } from './CallSummaryRow';
import { DateSeparator } from './DateSeparator';
import { MessageBubble } from './MessageBubble';
import { MessageGroup } from './MessageGroup';
import { MessageList } from './MessageList';
import { SystemMessage } from './SystemMessage';
import { TypingBubble } from './TypingBubble';
import { UnreadSeparator } from './UnreadSeparator';
import type { MessageListItem, MessageReaction } from './types';

const meta: Meta = {
  title: 'Blocks/Chat/Message Bubble',
};

export default meta;

type Story = StoryObj;

// Invented people, invented conversations.
const ANA = 'https://picsum.photos/seed/ana-restrepo/120/120';
const MARCEL = 'https://picsum.photos/seed/marcel-dube/120/120';
const NOUR = 'https://picsum.photos/seed/nour-haddad/120/120';

function Surface({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        overflow: 'hidden',
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      {children}
    </View>
  );
}

/** The same block in both modes, side by side — every colour here flips. */
function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, padding: 20 }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        {children}
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        {children}
      </BloomThemeProvider>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary, paddingLeft: 12 }}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
//  A 1:1 conversation
// ---------------------------------------------------------------------------

const DIRECT: MessageListItem[] = [
  {
    id: '1',
    direction: 'incoming',
    senderId: 'ana',
    senderName: 'Ana Restrepo',
    avatarSource: ANA,
    dateKey: '2026-03-11',
    dateLabel: 'Yesterday',
    text: 'The rehearsal room on Calle Verde is free on Thursday after seven.',
    time: '18:02',
  },
  {
    id: '2',
    direction: 'incoming',
    senderId: 'ana',
    text: 'They only take the whole evening though, so it is four hours or nothing.',
    time: '18:02',
  },
  {
    id: '3',
    direction: 'outgoing',
    text: 'Four hours works. I can bring the second amp.',
    time: '18:09',
    status: 'read',
  },
  {
    id: '4',
    direction: 'outgoing',
    text: 'Booked it.',
    time: '18:09',
    status: 'read',
    reactions: [{ emoji: '🎸', count: 2, mine: true }],
  },
  {
    id: '5',
    direction: 'incoming',
    senderId: 'ana',
    dateKey: '2026-03-12',
    dateLabel: 'Today',
    text: 'Did you see the message from the venue about the load-in?',
    time: '09:14',
    replyTo: { senderName: 'You', preview: 'Booked it.' },
  },
  {
    id: '6',
    direction: 'outgoing',
    unreadBefore: true,
    text: 'Not yet — forward it to me?',
    time: '09:20',
    status: 'delivered',
    editedLabel: 'edited',
  },
  {
    id: '7',
    direction: 'incoming',
    senderId: 'ana',
    forwardedFrom: 'Sala Verde',
    text: 'Load-in is from 18:30 at the back door. Ring the bell twice, the buzzer is broken.',
    time: '09:22',
  },
  {
    id: '8',
    direction: 'outgoing',
    text: 'Perfect. See you there.',
    time: '09:23',
    status: 'sending',
    pending: true,
  },
  {
    id: '9',
    direction: 'outgoing',
    text: 'One more thing —',
    time: '09:23',
    status: 'failed',
    failed: true,
    onRetry: () => undefined,
  },
];

/** A two-person thread: runs, a reply, a forward, reactions, edited, pending, failed. */
export const DirectConversation: Story = {
  render: function DirectStory() {
    return (
      <BothModes>
        <Surface width={390}>
          <MessageList items={DIRECT} showAvatars={false} showSenderNames={false} />
        </Surface>
      </BothModes>
    );
  },
};

// ---------------------------------------------------------------------------
//  A group conversation
// ---------------------------------------------------------------------------

const GROUP: MessageListItem[] = [
  {
    id: 'g0',
    direction: 'incoming',
    system: 'Nour Haddad joined the group',
    dateKey: '2026-03-12',
    dateLabel: 'Today',
  },
  {
    id: 'g1',
    direction: 'incoming',
    senderId: 'ana',
    senderName: 'Ana Restrepo',
    avatarSource: ANA,
    text: 'Right — who is bringing what on Thursday?',
    time: '11:02',
  },
  {
    id: 'g2',
    direction: 'incoming',
    senderId: 'marcel',
    senderName: 'Marcel Dubé',
    avatarSource: MARCEL,
    text: 'Drums are already in the room.',
    time: '11:04',
  },
  {
    id: 'g3',
    direction: 'incoming',
    senderId: 'marcel',
    text: 'I will bring the cymbal bag and the spare snare.',
    time: '11:04',
    reactions: [
      { emoji: '👍', count: 3 },
      { emoji: '🥁', count: 1, mine: true },
    ],
  },
  {
    id: 'g4',
    direction: 'outgoing',
    text: 'Two amps and the long cables from me.',
    time: '11:06',
    status: 'read',
  },
  {
    id: 'g5',
    direction: 'incoming',
    senderId: 'nour',
    senderName: 'Nour Haddad',
    avatarSource: NOUR,
    text: 'I can take the keys and the stand. Anyone got a spare sustain pedal?',
    time: '11:09',
    replyTo: { senderName: 'Marcel Dubé', preview: 'I will bring the cymbal bag and the spare snare.' },
  },
  {
    id: 'g6',
    direction: 'incoming',
    senderId: 'ana',
    text: 'This message was removed',
    deleted: true,
    time: '11:10',
  },
  {
    id: 'g7',
    direction: 'outgoing',
    call: { outcome: 'outgoing', title: 'Outgoing call', duration: '4 min', time: '11:12' },
  },
  {
    id: 'g8',
    direction: 'incoming',
    senderId: 'nour',
    call: { outcome: 'missed', title: 'Missed voice call', time: '11:40' },
  },
];

/** A group: per-sender name colours, avatars at the run's bottom, a system line, calls. */
export const GroupConversation: Story = {
  render: function GroupStory() {
    return (
      <BothModes>
        <Surface width={390}>
          <MessageList items={GROUP} />
          <TypingBubble senderName="Ana Restrepo" avatarSource={ANA} label="Ana is typing…" />
        </Surface>
      </BothModes>
    );
  },
};

// ---------------------------------------------------------------------------
//  Wide
// ---------------------------------------------------------------------------

/** The same group thread in a 900px transcript — the bubbles cap at 78%. */
export const Wide: Story = {
  render: function WideStory() {
    return (
      <BothModes>
        <Surface width={900}>
          <MessageList items={GROUP} />
        </Surface>
      </BothModes>
    );
  },
};

// ---------------------------------------------------------------------------
//  States
// ---------------------------------------------------------------------------

/** Every state a single bubble can be in, both directions. */
export const States: Story = {
  render: function StatesStory() {
    return (
      <BothModes>
        <Surface width={390}>
          <View style={{ gap: 10, paddingLeft: 8, paddingRight: 8 }}>
            <Caption>run geometry — first, middle, last, single</Caption>
            <MessageGroup direction="incoming" senderName="Ana Restrepo" avatarSource={ANA}>
              <MessageBubble direction="incoming" text="First of the run." />
              <MessageBubble direction="incoming" text="Middle of the run." />
              <MessageBubble direction="incoming" text="Last of the run." time="12:41" />
            </MessageGroup>
            <MessageGroup direction="outgoing">
              <MessageBubble direction="outgoing" text="First." status="read" />
              <MessageBubble direction="outgoing" text="Middle." status="read" />
              <MessageBubble direction="outgoing" text="Last." time="12:42" status="read" />
            </MessageGroup>

            <Caption>tail</Caption>
            <MessageBubble direction="incoming" tail text="With the notch." time="12:43" />
            <MessageBubble direction="outgoing" tail text="With the notch." time="12:43" status="delivered" />

            <Caption>pending · failed · deleted · selected · highlighted</Caption>
            <MessageBubble direction="outgoing" text="Queued." time="12:44" status="sending" pending />
            <MessageBubble
              direction="outgoing"
              text="Did not send."
              time="12:44"
              status="failed"
              failed
              onRetry={() => undefined}
            />
            <MessageBubble direction="incoming" deleted />
            <MessageBubble direction="incoming" text="Selected." time="12:45" selected />
            <MessageBubble direction="incoming" text="Jumped to." time="12:45" highlighted />

            <Caption>a long message — the meta drops to its own line</Caption>
            <MessageBubble
              direction="outgoing"
              text="The long version: the back door opens at half six, the lift only takes two flight cases at a time, and the desk is on the balcony so somebody has to run cables up the side stairs before anyone plugs anything in."
              time="12:46"
              status="read"
            />

            <Caption>entities and a channel post</Caption>
            <MessageBubble
              direction="incoming"
              text="Details at https://example.invalid/loadin — ping @marcel with #gear questions."
              time="12:47"
            />
            <MessageBubble
              direction="incoming"
              text="Doors at 19:00. Tickets on the door only."
              channelViews="12.4K"
              authorSignature="Sala Verde"
              time="12:48"
            />
          </View>
        </Surface>
      </BothModes>
    );
  },
};

// ---------------------------------------------------------------------------
//  Separators
// ---------------------------------------------------------------------------

/** The rows between messages. */
export const Separators: Story = {
  render: function SeparatorsStory() {
    return (
      <BothModes>
        <Surface width={390}>
          <DateSeparator label="Today" />
          <UnreadSeparator />
          <SystemMessage text="Ana Restrepo joined the group" />
          <SystemMessage text="You pinned a message" icon={<RiPushpinLine width={12} height={12} fill="#888" />} />
          <CallSummaryRow direction="incoming" outcome="incoming" title="Incoming call" duration="12:04" time="09:30" />
          <CallSummaryRow direction="incoming" outcome="missed" title="Missed video call" video time="09:41" />
          <CallSummaryRow direction="outgoing" outcome="outgoing" title="Outgoing call" duration="4 min" time="10:02" />
          <TypingBubble senderName="Nour Haddad" avatarSource={NOUR} label="Nour is typing…" />
        </Surface>
      </BothModes>
    );
  },
};

// ---------------------------------------------------------------------------
//  Interaction
// ---------------------------------------------------------------------------

const START: MessageReaction[] = [
  { emoji: '👍', count: 3 },
  { emoji: '🎸', count: 1, mine: true },
];

/** Selection mode and a live reaction toggle. */
export const SelectionAndReactions: Story = {
  render: function InteractiveStory() {
    const [picked, setPicked] = useState<Record<string, boolean>>({ b: true });
    const [reactions, setReactions] = useState<MessageReaction[]>(START);
    const toggle = (emoji: string) =>
      setReactions((current) =>
        current.map((reaction) =>
          reaction.emoji === emoji
            ? {
                ...reaction,
                mine: reaction.mine !== true,
                count: reaction.count + (reaction.mine === true ? -1 : 1),
              }
            : reaction,
        ),
      );
    return (
      <BothModes>
        <Surface width={390}>
          <View style={{ gap: 4, paddingLeft: 8, paddingRight: 8 }}>
            <MessageBubble
              direction="incoming"
              senderName="Ana Restrepo"
              text="Tap either bubble to select it."
              time="12:41"
              selected={picked.a === true}
              onPress={() => setPicked((s) => ({ ...s, a: s.a !== true }))}
            />
            <MessageBubble
              direction="outgoing"
              text="And press a pill to react."
              time="12:42"
              status="read"
              selected={picked.b === true}
              onPress={() => setPicked((s) => ({ ...s, b: s.b !== true }))}
              reactions={reactions}
              onToggleReaction={toggle}
              onAddReaction={() => undefined}
            />
          </View>
        </Surface>
      </BothModes>
    );
  },
};
