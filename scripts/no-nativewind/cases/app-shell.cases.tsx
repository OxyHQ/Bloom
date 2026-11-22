import { Text } from 'react-native';
import { AppShell, AppShellPanel, AppShellPanelVisibility } from '@bloom/app-shell';
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
};
