import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppShell, NotificationBell } from '../../src/app-shell';
import { ACCOUNT, NAV_ITEMS, NOTIFICATIONS, SECONDARY_ITEMS, TEAM, TEMPLATE_FRAME } from '../shared/dashboard';
import { ProjectBoardTemplate } from './ProjectBoardTemplate';

/** Shared dashboard rail and 272px reveal drawer, as in the original template. */
export function ProjectBoardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState('project-board');
  const { height } = useWindowDimensions();
  return <View style={TEMPLATE_FRAME}>
    <AppShell drawer="reveal" drawerOpen={mobileOpen} onDrawerOpenChange={setMobileOpen} header={<></>} contentMaxWidth={Number.MAX_SAFE_INTEGER} sidebar={{ items: NAV_ITEMS, secondaryItems: SECONDARY_ITEMS, selected, onNavigate: item => setSelected(item.key), account: ACCOUNT, team: TEAM }}>
      <View style={{ height: Math.max(400, height - 48), width: '100%' }}>
        <ProjectBoardTemplate onMenuClick={() => setMobileOpen(true)} headerActions={<NotificationBell notifications={NOTIFICATIONS} unreadCount={5} width={430} />} />
      </View>
    </AppShell>
  </View>;
}
