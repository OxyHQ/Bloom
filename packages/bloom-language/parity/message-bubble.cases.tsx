import { MessageBubble, MessageList, TypingBubble } from '@oxy.so/bloom/message-bubble';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const REACTIONS = [
  { emoji: '❤️', count: 2, mine: true },
  { emoji: '😂', count: 1 },
];
const REPLY = { senderName: 'Marcel', preview: 'See you at eight?' };
const ITEMS = [
  {
    id: 'm1',
    direction: 'incoming' as const,
    senderId: 'marcel',
    senderName: 'Marcel Dubé',
    text: 'Are we still on for tonight?',
    time: '18:02',
    dateKey: '2026-11-20',
    dateLabel: 'Yesterday',
  },
  {
    id: 'm2',
    direction: 'incoming' as const,
    senderId: 'marcel',
    senderName: 'Marcel Dubé',
    text: 'I booked the place by the harbour',
    time: '18:03',
    dateKey: '2026-11-20',
    dateLabel: 'Yesterday',
  },
  {
    id: 's1',
    direction: 'incoming' as const,
    system: 'Ana joined the group',
    dateKey: '2026-11-21',
    dateLabel: 'Today',
  },
  {
    id: 'm3',
    direction: 'outgoing' as const,
    senderId: 'me',
    text: 'Yes, see you there',
    time: '09:14',
    status: 'read' as const,
    dateKey: '2026-11-21',
    dateLabel: 'Today',
    unreadBefore: true,
  },
  {
    id: 'c1',
    direction: 'outgoing' as const,
    call: { outcome: 'missed' as const, title: 'Missed call', time: '09:20' },
    dateKey: '2026-11-21',
    dateLabel: 'Today',
  },
];

const bubbles: ParityCase[] = [
  ...ENUMS.messageTone.map((direction) => ({
    name: `MessageBubble ${direction}`,
    language: () => toElement(L.MessageBubble(direction, 'Hello there', { time: '09:14' })),
    bloom: () => <MessageBubble direction={direction} text="Hello there" time="09:14" />,
  })),
  ...ENUMS.messagePosition.map((position) => ({
    name: `MessageBubble ${position} of a run, a tail`,
    language: () =>
      toElement(L.MessageBubble('outgoing', 'On my way').groupPosition(position).tail()),
    bloom: () => <MessageBubble direction="outgoing" text="On my way" position={position} tail />,
  })),
  ...ENUMS.messageMediaFit.map((fit) => ({
    name: `MessageBubble media ${fit}, its time over it`,
    language: () =>
      toElement(
        L.MessageBubble('incoming', undefined, {
          media: L.Image(PHOTO).frame({ width: '200', height: '120' }),
          time: '10:01',
        })
          .mediaFit(fit)
          .metaOverlay(),
      ),
    bloom: () => (
      <MessageBubble
        direction="incoming"
        media={toElement(L.Image(PHOTO).frame({ width: '200', height: '120' }))}
        time="10:01"
        mediaFit={fit}
        metaOverlay
      />
    ),
  })),
  {
    name: 'MessageBubble a sender, a reply, reactions, edited, forwarded',
    language: () =>
      toElement(
        L.MessageBubble('incoming', 'Look at this', {
          senderName: 'Nour Haddad',
          senderColorSeed: 'nour',
          replyTo: REPLY,
          onPressReply: press,
          forwardedFrom: 'Travel tips',
          editedLabel: 'edited',
          time: '11:40',
          reactions: REACTIONS,
          onToggleReaction: set,
          onAddReaction: press,
          maxWidth: '280',
        }),
      ),
    bloom: () => (
      <MessageBubble
        direction="incoming"
        text="Look at this"
        senderName="Nour Haddad"
        senderColorSeed="nour"
        replyTo={REPLY}
        onPressReply={press}
        forwardedFrom="Travel tips"
        editedLabel="edited"
        time="11:40"
        reactions={REACTIONS}
        onToggleReaction={set}
        onAddReaction={press}
        maxWidth={280}
      />
    ),
  },
  {
    name: 'MessageBubble a sender in a role',
    language: () =>
      toElement(L.MessageBubble('incoming', 'Tinted', { senderName: 'Ito' }).senderTint('success')),
    bloom: () => (
      <Themed>
        {(c) => (
          <MessageBubble
            direction="incoming"
            text="Tinted"
            senderName="Ito"
            senderColor={c.success}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'MessageBubble rich content, pressable, named',
    language: () =>
      toElement(
        L.MessageBubble('outgoing', L.Text('Bold idea'), { time: '12:00', status: 'delivered' })
          .onPress(press)
          .onLongPress(press)
          .label('Your message'),
      ),
    bloom: () => (
      <MessageBubble
        direction="outgoing"
        time="12:00"
        status="delivered"
        onPress={press}
        onLongPress={press}
        accessibilityLabel="Your message"
      >
        <Text>Bold idea</Text>
      </MessageBubble>
    ),
  },
  {
    name: 'MessageBubble pending, failed, deleted, selected',
    language: () =>
      toElement(
        L.MessageBubble('outgoing', 'Sending…', {
          pending: true,
          failed: true,
          onRetry: press,
          selected: true,
          deleted: true,
        }),
      ),
    bloom: () => (
      <MessageBubble
        direction="outgoing"
        text="Sending…"
        pending
        failed
        onRetry={press}
        selected
        deleted
      />
    ),
  },
];

const lists: ParityCase[] = [
  {
    name: 'MessageList',
    language: () => toElement(L.MessageList(ITEMS, { unreadLabel: 'New messages' })),
    bloom: () => <MessageList items={ITEMS} unreadLabel="New messages" />,
  },
  {
    name: 'MessageList avatars and names of a group',
    language: () =>
      toElement(
        L.MessageList(ITEMS, { showAvatars: true, showSenderNames: true, avatarSize: '28' }),
      ),
    bloom: () => <MessageList items={ITEMS} showAvatars showSenderNames avatarSize={28} />,
  },
];

export const MESSAGE_BUBBLE_CASES: ParityCase[] = [...bubbles, ...lists];

/** The typing dots pulse and a highlight flashes on the JS thread: compared by Jest as they mount. */
export const MESSAGE_BUBBLE_CASES_MOVING: ParityCase[] = [
  {
    name: 'TypingBubble',
    language: () => toElement(L.TypingBubble()),
    bloom: () => <TypingBubble />,
  },
  {
    name: 'TypingBubble incoming, a sender and avatar, named',
    language: () =>
      toElement(
        L.TypingBubble({
          direction: 'incoming',
          senderName: 'Ana',
          avatarSource: PHOTO,
          showAvatar: true,
          avatarSize: '28',
        }).label('Ana is typing'),
      ),
    bloom: () => (
      <TypingBubble
        direction="incoming"
        senderName="Ana"
        avatarSource={PHOTO}
        showAvatar
        avatarSize={28}
        label="Ana is typing"
      />
    ),
  },
  {
    name: 'MessageBubble highlighted',
    language: () => toElement(L.MessageBubble('incoming', 'Jumped to', { highlighted: true })),
    bloom: () => <MessageBubble direction="incoming" text="Jumped to" highlighted />,
  },
];
