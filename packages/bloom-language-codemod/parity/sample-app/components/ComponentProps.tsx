// Bloom components with props the language takes as modifiers: an avatar's own
// corners, a facepile's ring and rendition, a search that takes no typing, a
// detached bottom dialog kept to a width.
import { Avatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup, type AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import { Dialog } from '@oxy.so/bloom/dialog';
import { Search } from '@oxy.so/bloom/search';
import { useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

const MEMBERS: AvatarGroupItem[] = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Rui' },
];

export function ListCover({ uri }: { uri: string }) {
  return <Avatar source={uri} size={36} style={{ borderRadius: 12 }} />;
}

export function RoomListeners() {
  const theme = useTheme();
  return <AvatarGroup items={MEMBERS} ringColor={theme.colors.background} variant="small" />;
}

export function PackSearch({ value, set }: { value: string; set: (text: string) => void }) {
  return <Search value={value} onValueChange={set} editable={false} placeholder="Add people" />;
}

export function Checkout({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Dialog open={open} onClose={close} placement="bottom" detached panelStyle={{ maxWidth: 540 }}>
      <Text>Pay</Text>
    </Dialog>
  );
}
