import {
  ChatFolderTabs,
  ChatSearchField,
  HighlightedText,
  NewChatButton,
  StoriesRow,
} from '@bloom/chat-list';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  ChatFolderTabs: () => (
    <ChatFolderTabs
      folders={[
        { key: 'all', label: 'All', unreadCount: 15 },
        { key: 'channels', label: 'Channels', unreadCount: 148, muted: true },
        { key: 'bots', label: 'Bots' },
      ]}
      value="all"
      onValueChange={() => {}}
      accessibilityLabel="Chat folders"
    />
  ),
  ChatSearchField: () => <ChatSearchField value="ana" onChangeText={() => {}} onClear={() => {}} />,
  HighlightedText: () => <HighlightedText text="Hello Ana" query="ana" />,
  NewChatButton: () => <NewChatButton onPress={() => {}} />,
  StoriesRow: () => (
    <StoriesRow
      stories={[
        { id: 'ines', name: 'Inés', state: 'seen' },
        { id: 'bru', name: 'Bru Ferragut', state: 'unseen' },
      ]}
      own={{ name: 'Mireia Solans' }}
    />
  ),
};
