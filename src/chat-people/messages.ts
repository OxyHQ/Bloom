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
  /** Role badge labels and member commands. */
  member: MemberRoleLabels;
  /** `StoryViewer` and `StoryProgressBars`. `progress` takes a ZERO-based index. */
  story: StoryViewerLabels;
  /** Member search placeholder. */
  searchMembers: string;
  /** The list alphabet index: "Jump to K". */
  jumpTo: (letter: string) => string;
  /** The person action button, its done mark, and the button's name about one person. */
  add: string;
  added: string;
  actionOn: (action: string, name: string) => string;
}

export const CHAT_PEOPLE_MESSAGES: MessageCatalog<ChatPeopleMessages> =
  defineMessages<ChatPeopleMessages>('CHAT_PEOPLE_MESSAGES', {
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
    jumpTo: (letter) => `Jump to ${letter}`,
    add: 'Add',
    added: 'Added',
    actionOn: (action, name) => `${action} ${name}`,
  });
