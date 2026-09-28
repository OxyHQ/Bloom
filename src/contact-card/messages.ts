import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { ContactChannelKind } from './types';

/**
 * Every fixed string the contact-card family draws or announces, in each
 * Bloom language. A channel's `label`, an owner's `label` and the caller's
 * own copy still win over these.
 */
export interface ContactCardMessages {
  /**
   * Per channel: `action`, the one-word label on a card wide enough to carry
   * one, and `name`, the button's accessible name about the subject — a whole
   * phrase per language, since a preposition's place and case differ.
   */
  channels: Record<ContactChannelKind, { action: string; name: (subject: string) => string }>;
  /** Names the row of fact and tag chips. */
  labelsFor: (name: string) => string;
  /** The word before the owner's name in the footer. */
  owner: string;
}

export const CONTACT_CARD_MESSAGES: MessageCatalog<ContactCardMessages> = defineMessages<ContactCardMessages>('CONTACT_CARD_MESSAGES', {
  channels: {
    email: { action: 'Email', name: (s) => `Email ${s}` },
    phone: { action: 'Call', name: (s) => `Call ${s}` },
    chat: { action: 'Message', name: (s) => `Message ${s}` },
    meeting: { action: 'Meet', name: (s) => `Schedule a meeting with ${s}` },
    video: { action: 'Video', name: (s) => `Start a video call with ${s}` },
    website: { action: 'Website', name: (s) => `Open the website of ${s}` },
  },
  labelsFor: (name) => `Labels for ${name}`,
  owner: 'Owner',
});
