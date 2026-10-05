import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Sidebar } from '../../src/sidebar';
import { NotificationBell } from '../../src/app-shell';
import {
  StyledView,
  StyledPressable,
} from '../../src/styles/styled-primitives';
import { useIsRtl } from '../../src/hooks/use-is-rtl';
import { useCommonMessages } from '../../src/locale/common-messages';
import {
  ACCOUNT,
  NAV_ITEMS,
  NOTIFICATIONS,
  SECONDARY_ITEMS,
  TEAM,
} from '../shared/dashboard';
import { ProjectBoardTemplate } from './ProjectBoardTemplate';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
const AnimatedPressable = Animated.createAnimatedComponent(StyledPressable);
/** Source 4472:12159 shell: 12px floating sidebar, 24px main inset, 272px reveal. */
export function ProjectBoardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState('project-board');
  const { height, width } = useWindowDimensions();
  const desktop = width >= 1024;
  const rtl = useIsRtl();
  const reduced = useReducedMotion();
  const common = useCommonMessages();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(mobileOpen && !desktop ? 1 : 0, {
      duration: reduced ? 0 : 325,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
  }, [mobileOpen, desktop, progress, reduced]);
  const drawerStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.94 + 0.06 * progress.value }],
    }),
    [progress],
  );
  const mainStyle = useAnimatedStyle(
    () => ({
      borderRadius: 32 * progress.value,
      transform: [{ translateX: (rtl ? -272 : 272) * progress.value }],
    }),
    [progress, rtl],
  );
  const maskStyle = useAnimatedStyle(
    () => ({ opacity: progress.value }),
    [progress],
  );
  const sidebar = (
    <Sidebar
      items={NAV_ITEMS}
      secondaryItems={SECONDARY_ITEMS}
      selected={selected}
      onNavigate={(item) => setSelected(item.key)}
      account={ACCOUNT}
      team={TEAM}
      size="md"
      style={{ width: 260, height: '100%' }}
    />
  );
  return (
    <StyledView
      className="relative flex w-full overflow-hidden bg-background-full h-dvh"
      style={{ height, width: '100%', flexDirection: 'row' }}
    >
      {desktop && (
        <StyledView
          className="sticky top-3 z-10 hidden shrink-0 ps-3 lg:block h-[calc(100dvh-24px)]"
          style={{
            width: 272,
            height: height - 24,
            paddingLeft: 12,
            paddingTop: 0,
            marginTop: 12,
          }}
        >
          {sidebar}
        </StyledView>
      )}
      {!desktop && (
        <StyledView
          className="start-0 z-10 flex w-[272px] py-3 ps-[6px] lg:hidden fixed inset-y-0"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 272,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 6,
          }}
          accessibilityElementsHidden={!mobileOpen}
          importantForAccessibility={
            mobileOpen ? 'auto' : 'no-hide-descendants'
          }
        >
          <AnimatedView
            className={`h-full w-[260px] origin-left rtl:origin-right will-change-transform ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            pointerEvents={mobileOpen ? 'auto' : 'none'}
            style={drawerStyle}
          >
            {sidebar}
          </AnimatedView>
        </StyledView>
      )}
      <AnimatedView
        className="relative z-20 flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background-full p-3 will-change-transform sm:px-6 sm:pt-6 sm:pb-[22px] lg:z-0 lg:!transform-none lg:!rounded-none lg:pe-7"
        style={[
          {
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            paddingLeft: width >= 640 ? 24 : 12,
            paddingRight: desktop ? 28 : width >= 640 ? 24 : 12,
            paddingTop: width >= 640 ? 24 : 12,
            paddingBottom: width >= 640 ? 22 : 12,
          },
          mainStyle,
        ]}
      >
        {!desktop && mobileOpen && (
          <AnimatedPressable
            accessibilityLabel={common.close}
            accessibilityRole="button"
            onPress={() => setMobileOpen(false)}
            className="absolute inset-0 z-50 cursor-pointer rounded-[inherit] bg-black/10 dark:bg-white/5 lg:hidden pointer-events-auto"
            style={maskStyle}
          />
        )}
        <ProjectBoardTemplate
          onMenuClick={() => setMobileOpen(true)}
          headerActions={
            <NotificationBell
              notifications={NOTIFICATIONS}
              unreadCount={5}
              width={430}
            />
          }
        />
      </AnimatedView>
    </StyledView>
  );
}
