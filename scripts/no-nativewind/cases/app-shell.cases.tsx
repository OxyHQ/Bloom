import { Text } from 'react-native';
import {
  AppShell,
  AppShellPanel,
  AppShellPanelVisibility,
  NotificationBell,
} from '@bloom/app-shell';
import type { Cases } from '../support/cases';

const NAV = [
  { id: 'home', label: 'Home', icon: () => null },
  { id: 'inbox', label: 'Inbox', icon: () => null },
];

export const CASES: Cases = {
  'AppShell feed with panel': () => (
    <AppShell testID="shell" variant="feed" panels sidebar={{ items: NAV }}>
      <AppShellPanel>
        <AppShellPanelVisibility when="alone">
          <Text>Alone</Text>
        </AppShellPanelVisibility>
        <Text>Body</Text>
      </AppShellPanel>
    </AppShell>
  ),
  'AppShell focus': () => (
    <AppShell testID="shell" variant="focus">
      <Text>Body</Text>
    </AppShell>
  ),
  'NotificationBell unread': () => (
    <NotificationBell
      notifications={[
        {
          id: 'a',
          category: 'activity',
          group: 'Today',
          title: 'Invoice paid',
          description: 'Ana paid you',
          timestamp: '2m',
          unread: true,
        },
      ]}
      testID="bell"
    />
  ),
};
