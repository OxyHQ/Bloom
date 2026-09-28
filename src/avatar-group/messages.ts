import { defineMessages, type MessageCatalog } from '../locale/messages';

/** Every fixed string the avatar-group family announces, in each Bloom language. */
export interface AvatarGroupMessages {
  /** Names the pressable `+N` overflow chip: the people not shown. */
  more: (count: number) => string;
  /** Names a member's hover card when the member has no name. */
  profile: string;
}

export const AVATAR_GROUP_MESSAGES: MessageCatalog<AvatarGroupMessages> = defineMessages<AvatarGroupMessages>('AVATAR_GROUP_MESSAGES', { more: (n) => `${n} more`, profile: 'Profile' });
