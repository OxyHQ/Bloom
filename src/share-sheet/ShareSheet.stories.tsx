import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShareSheet } from './index';
import type { ShareSheetTarget } from './types';
import { RiLinksLine } from '../icons/remix/RiLinksLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiShareLine } from '../icons/remix/RiShareLine';
import { RiTelegramFill } from '../icons/remix/RiTelegramFill';
import { RiTwitterXFill } from '../icons/remix/RiTwitterXFill';
import { RiWhatsappFill } from '../icons/remix/RiWhatsappFill';

const meta: Meta<typeof ShareSheet> = {
  id: 'base-share-sheet',
  title: 'Components/Overlays/Share Sheet',
  component: ShareSheet,
};

export default meta;

type Story = StoryObj<typeof ShareSheet>;

const PEOPLE = [
  { id: '1', name: 'Ana García', subtitle: '@ana' },
  { id: '2', name: 'Bruno', subtitle: '@bruno' },
  { id: '3', name: 'Chiara Rossi', subtitle: '@chiara' },
  { id: '4', name: 'Dmitri', subtitle: '@dmitri' },
  { id: '5', name: 'Emeka Okafor with a long name', subtitle: '@emeka' },
  { id: '6', name: 'Fatima', subtitle: '@fatima' },
];

const TARGETS: ShareSheetTarget[] = [
  { key: 'copy', label: 'Copy link', icon: RiLinksLine, onPress: () => {} },
  { key: 'whatsapp', label: 'WhatsApp', icon: RiWhatsappFill, onPress: () => {} },
  { key: 'telegram', label: 'Telegram', icon: RiTelegramFill, onPress: () => {} },
  { key: 'x', label: 'X', icon: RiTwitterXFill, onPress: () => {} },
  { key: 'email', label: 'Email', icon: RiMailLine, onPress: () => {} },
  { key: 'more', label: 'More', icon: RiShareLine, onPress: () => {} },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <View style={{ width: 420, maxWidth: '100%' }}>{children}</View>;
}

function Searchable() {
  const [term, setTerm] = useState('');
  const people = useMemo(
    () => PEOPLE.filter((p) => p.name.toLowerCase().includes(term.trim().toLowerCase())),
    [term],
  );
  return (
    <Frame>
      <ShareSheet
        search={{ value: term, onValueChange: setTerm }}
        people={people}
        onPersonPress={() => {}}
        targets={TARGETS}
      />
    </Frame>
  );
}

export const Default: Story = { render: () => <Searchable /> };

export const Loading: Story = {
  render: () => (
    <Frame>
      <ShareSheet
        search={{ value: '', onValueChange: () => {} }}
        people={[]}
        peopleLoading
        targets={TARGETS}
      />
    </Frame>
  ),
};

export const TargetsOnly: Story = {
  render: () => (
    <Frame>
      <ShareSheet targets={TARGETS} />
    </Frame>
  ),
};
