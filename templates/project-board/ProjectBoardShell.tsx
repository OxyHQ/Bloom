import { useState } from 'react';
import { AppShell, NotificationBell, useAppShell } from '../../src/app-shell';
import { ACCOUNT, NAV_ITEMS, NOTIFICATIONS, SECONDARY_ITEMS, TEAM } from '../shared/dashboard';
import { ProjectBoardTemplate } from './ProjectBoardTemplate';

function BoardContent() {
  const shell = useAppShell();
  return (
    <ProjectBoardTemplate
      onMenuClick={shell.drawerAvailable ? shell.openDrawer : undefined}
      headerActions={<NotificationBell notifications={NOTIFICATIONS} unreadCount={5} width={430} />}
    />
  );
}

/** The board owns its data; the shared shell owns navigation, insets and motion. */
export function ProjectBoardShell() {
  const [selected, setSelected] = useState('project-board');
  return (
    <AppShell
      testID="project-board-shell"
      variant="dashboard"
      scroll="fixed"
      drawer="reveal"
      header={null}
      contentMaxWidth="none"
      sidebar={{
        items: NAV_ITEMS,
        secondaryItems: SECONDARY_ITEMS,
        selected,
        onNavigate: (item) => setSelected(item.key),
        account: ACCOUNT,
        team: TEAM,
        size: 'md',
      }}
    >
      <BoardContent />
    </AppShell>
  );
}
