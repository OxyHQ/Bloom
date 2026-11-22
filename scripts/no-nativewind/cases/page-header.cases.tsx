import { Text } from 'react-native';
import { PageHeader, PageHeaderTitleInput } from '@bloom/page-header';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'PageHeader plain': () => <PageHeader title="Inbox" testID="h" />,
  'PageHeader compact': () => <PageHeader title="Inbox" density="compact" onBack={() => {}} />,
  'PageHeader navigation, loaded': () => (
    <PageHeader
      title="Projects"
      subtitle="12 open"
      overline={<Text>Team</Text>}
      presentation="navigation"
      onBack={() => {}}
      actions={<Text>Act</Text>}
      accessory={<Text>12 records</Text>}
      testID="h"
    />
  ),
  'PageHeader with accessory': () => (
    <PageHeader
      title="Board"
      accessory={<Text>12 records</Text>}
      border="always"
      presentation="bar"
    />
  ),
  PageHeaderTitleInput: () => <PageHeaderTitleInput label="Title" value="Projects" />,
};
