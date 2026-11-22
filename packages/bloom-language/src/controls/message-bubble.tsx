import {
  MessageBubble as BloomMessageBubble,
  type MessageBubbleProps,
  MessageList as BloomMessageList,
  type MessageListItem,
  type MessageListProps,
  TypingBubble as BloomTypingBubble,
  type TypingBubbleProps,
} from '@oxy.so/bloom/message-bubble';

import { type Child, Node, type ViewModifiers } from '../node';
import type {
  ColorToken,
  MessageMediaFit,
  MessagePosition,
  MessageTone,
  SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** The message bubbles: one message, the typing bubble and a list grouped by sender. */
export type MessageBubbleKind = 'messageBubble' | 'typingBubble' | 'messageList';

/** What the language draws itself: the box, the name, the presses, the look. */
type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `MessageBubble`'s data: its sender, reply, reactions, time and state,
 * its handlers and words. Its media is a language child; its widest a space
 * token. What it looks like is its modifiers; `.onPress()` and
 * `.onLongPress()` are its own.
 */
export type MessageBubbleOptions = Omit<
  MessageBubbleProps,
  | Drawn
  | 'direction'
  | 'text'
  | 'children'
  | 'media'
  | 'maxWidth'
  | 'position'
  | 'mediaFit'
  | 'tail'
  | 'metaOverlay'
  | 'senderColor'
  | 'bubbleStyle'
  | 'textStyle'
  | 'onPress'
  | 'onLongPress'
> & { readonly media?: Child; readonly maxWidth?: SpaceToken };
/** Bloom `TypingBubble`'s side and sender; its avatar's size is a space token. */
export type TypingBubbleOptions = Omit<TypingBubbleProps, Drawn | 'label' | 'avatarSize'> & {
  readonly avatarSize?: SpaceToken;
};
/** Bloom `MessageList`'s choices and words; its avatars' size is a space token. */
export type MessageListOptions = Omit<
  MessageListProps,
  Drawn | 'items' | 'contentStyle' | 'avatarSize'
> & { readonly avatarSize?: SpaceToken };

/** Bloom `MessageBubble`: one message. */
export interface MessageBubbleView extends ViewModifiers<MessageBubbleView> {
  /** Where it sits in its sender's run: `single` (default), `first`, `middle` or `last`. */
  groupPosition(value: MessagePosition): MessageBubbleView;
  /** How its media sits: `bleed` (default) to the edges, `inset` in the padding, or `bare` with no bubble. */
  mediaFit(value: MessageMediaFit): MessageBubbleView;
  /** The tail on its sender's side. */
  tail(value?: boolean): MessageBubbleView;
  /** Its time and status drawn over its media. */
  metaOverlay(value?: boolean): MessageBubbleView;
  /** The sender's name's colour, a role (by default one picked from the sender's seed). */
  senderTint(value: ColorToken): MessageBubbleView;
}
export type TypingBubbleView = ViewModifiers<TypingBubbleView>;
export type MessageListView = ViewModifiers<MessageListView>;

/**
 * Bloom `MessageBubble` from `direction`'s side: `content` is its text (a
 * string, which Bloom links and wraps) or a view of rich content.
 */
export function MessageBubble(
  direction: MessageTone,
  content?: string | Child,
  options: MessageBubbleOptions = {},
): MessageBubbleView {
  return typeof content === 'string'
    ? new Node('messageBubble', { direction, text: content, options }, [])
    : new Node('messageBubble', { direction, options }, content === undefined ? [] : [content]);
}
/** Bloom `TypingBubble`: someone is typing; `.label()` names it ("typing" by default). */
export function TypingBubble(options: TypingBubbleOptions = {}): TypingBubbleView {
  return new Node('typingBubble', { options }, []);
}
/** Bloom `MessageList` of `items`, grouped by sender and day. */
export function MessageList(
  items: readonly MessageListItem[],
  options: MessageListOptions = {},
): MessageListView {
  return new Node('messageList', { items, options }, []);
}

const flag = (d: ControlDraw, kind: 'tail' | 'metaOverlay') =>
  d.own(kind)?.value as boolean | undefined;

export const MESSAGE_BUBBLES: Record<MessageBubbleKind, ControlRenderer> = {
  messageBubble: product(BloomMessageBubble, {
    slots: ['media'],
    lengths: ['maxWidth'],
    press: true,
    own: (d) => ({
      position: d.own('groupPosition')?.value,
      mediaFit: d.own('mediaFit')?.value,
      tail: flag(d, 'tail'),
      metaOverlay: flag(d, 'metaOverlay'),
    }),
    colors: (d) => ({ senderColor: d.own('senderTint')?.value as ColorToken | undefined }),
  }),
  typingBubble: product(BloomTypingBubble, {
    lengths: ['avatarSize'],
    own: (d) => ({ label: d.label }),
  }),
  messageList: product(BloomMessageList, { lengths: ['avatarSize'] }),
};
