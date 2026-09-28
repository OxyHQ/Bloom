import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the message-bubble family draws or announces, in each
 * Bloom language. A caller's `labels` / `label` prop still wins over any entry
 * here. Dates, call titles and durations are pre-formatted by the caller.
 */
export interface MessageBubbleMessages {
  /** The forwarded line: "Forwarded from Ana". */
  forwardedFrom: (name: string) => string;
  /** What a deleted bubble says. */
  deleted: string;
  /** Names the retry control on a failed message. */
  retry: string;
  /** Names the `+` reaction control. */
  addReaction: string;
  /** Names the reply quote when it is pressable. */
  replyTo: string;
  /** Announced on a selected bubble. */
  selected: string;
  /** Announced on a message that has not been sent yet. */
  pending: string;
  /** Announced on a message that failed to send. */
  failed: string;
  /** Appended to a reaction pill's name when it is the reader's own: "👍, 3, selected". */
  reactionSelected: string;
  /** `UnreadSeparator`'s label. */
  unread: string;
  /** `TypingBubble`'s name. */
  typing: string;
}

export const MESSAGE_BUBBLE_MESSAGES: MessageCatalog<MessageBubbleMessages> = defineMessages<MessageBubbleMessages>('MESSAGE_BUBBLE_MESSAGES', {
  forwardedFrom: (name) => `Forwarded from ${name}`,
  deleted: 'This message was deleted',
  retry: 'Retry sending',
  addReaction: 'Add a reaction',
  replyTo: 'Go to the quoted message',
  selected: 'Selected',
  pending: 'Sending',
  failed: 'Not sent',
  reactionSelected: 'selected',
  unread: 'Unread messages',
  typing: 'Typing…',
});
