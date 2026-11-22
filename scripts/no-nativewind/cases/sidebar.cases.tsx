import { Text } from 'react-native';
import { RiHome5Line } from '@bloom/icons/remix/RiHome5Line';
import { Sidebar, SidebarItem, SidebarOnboardingCard, SidebarToolbar } from '@bloom/sidebar';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Sidebar with items': () => (
    <Sidebar
      testID="sb"
      items={[
        { key: 'home', label: 'Home', icon: RiHome5Line, selected: true, style: { opacity: 0.9 } },
        { key: 'inbox', label: 'Inbox', icon: RiHome5Line },
      ]}
    />
  ),
  'SidebarItem described': () => (
    <SidebarItem icon={RiHome5Line} label="Home" description="Start" selected onPress={() => {}} />
  ),
  SidebarToolbar: () => (
    <SidebarToolbar
      actions={[<Text key="a">A</Text>]}
      search={{ open: false, onOpenChange: () => {}, value: '', onValueChange: () => {} }}
    />
  ),
  SidebarOnboardingCard: () => (
    <SidebarOnboardingCard
      title="Get started"
      steps={[{ key: 'a', label: 'Invite', completed: false }]}
      onSeeAll={() => {}}
    />
  ),
};
