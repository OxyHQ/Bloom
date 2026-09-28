import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { MemberRoleLabels, NewGroupFormLabels, StoryViewerLabels } from './types';

/**
 * Every fixed string the chat-people family draws or announces, in each Bloom
 * language. A caller's `labels` / `*Label` / `format*Label` prop still wins
 * over any entry here.
 */
export interface ChatPeopleMessages {
  /** `NewGroupForm`. */
  newGroup: NewGroupFormLabels;
  /** `MemberRow` / `MemberList`: role badges and the member menu. */
  member: MemberRoleLabels;
  /** `StoryViewer` and `StoryProgressBars`. `progress` takes a ZERO-based index. */
  story: StoryViewerLabels;
  /** `MemberList`'s search placeholder. */
  searchMembers: string;
  /** `ChannelPostCard`'s share button, more button and pin mark. */
  share: string;
  postOptions: string;
  pinned: string;
  /** A post's pre-formatted counts ("12.4K", "318") as a spoken name. */
  views: (count: string) => string;
  forwards: (count: string) => string;
  /** `ContactList`'s alphabet rail: "Jump to K". */
  jumpTo: (letter: string) => string;
  /** `ContactRow`'s action button, its done mark, and the button's name about one person. */
  add: string;
  added: string;
  actionOn: (action: string, name: string) => string;
}

/**
 * The number a pre-formatted count stands for, to choose a plural form. An
 * abbreviated one ("12.4K") is some large number: 11 picks the "many" form in
 * the languages that have one, and "other" everywhere else.
 */

export const CHAT_PEOPLE_MESSAGES: MessageCatalog<ChatPeopleMessages> = defineMessages<ChatPeopleMessages>('CHAT_PEOPLE_MESSAGES', {
  newGroup: {
    photo: 'Choose a group photo',
    name: 'Group name',
    namePlaceholder: 'Name this group',
    description: 'Description',
    descriptionPlaceholder: 'What is this group for?',
    members: (n) => plural('en', n, { one: '{n} member', other: '{n} members' }),
    addMembers: 'Add members',
    remove: (name) => `Remove ${name}`,
  },
  member: {
    owner: 'Owner',
    admin: 'Admin',
    promote: 'Promote to admin',
    restrict: 'Restrict',
    remove: 'Remove from group',
    actions: (name) => `Actions for ${name}`,
  },
  story: {
    close: 'Close story',
    previous: 'Previous story',
    next: 'Next story',
    mute: 'Mute story',
    unmute: 'Unmute story',
    more: 'Story options',
    replyPlaceholder: 'Reply…',
    send: 'Send reply',
    progress: (index, count) => `Story ${index + 1} of ${count}`,
    react: (emoji) => `React with ${emoji}`,
  },
  searchMembers: 'Search members',
  share: 'Share',
  postOptions: 'Post options',
  pinned: 'Pinned',
  views: (c) => plural('en', c, { one: `${c} view`, other: `${c} views` }),
  forwards: (c) => plural('en', c, { one: `${c} forward`, other: `${c} forwards` }),
  jumpTo: (letter) => `Jump to ${letter}`,
  add: 'Add',
  added: 'Added',
  actionOn: (action, name) => `${action} ${name}`,
});
