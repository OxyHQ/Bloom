import { defineMessages, type MessageCatalog } from '../locale/messages';

export interface AvatarMessages {
  live: string;
}

export const AVATAR_MESSAGES: MessageCatalog<AvatarMessages> = defineMessages<AvatarMessages>('AVATAR_MESSAGES', { live: 'LIVE' });
