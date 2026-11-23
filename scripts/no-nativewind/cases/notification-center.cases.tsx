import { NotificationCenter } from '@bloom/notification-center';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'NotificationCenter empty': () => <NotificationCenter notifications={[]} />,
  'NotificationCenter loaded': () => (
    <NotificationCenter
      title="Notifications"
      notifications={[
        {
          id: '1',
          category: 'activity',
          group: 'Today',
          title: 'Ana replied',
          description: 'Looks good',
          timestamp: '2m',
          unread: true,
          avatar: { name: 'Ana', color: 'blue' },
          actions: [{ id: 'open', label: 'Open' }],
        },
        {
          id: '2',
          category: 'activity',
          group: 'Earlier',
          title: 'Build failed',
          description: 'main',
          timestamp: '1h',
          status: 'error',
        },
      ]}
    />
  ),
};
