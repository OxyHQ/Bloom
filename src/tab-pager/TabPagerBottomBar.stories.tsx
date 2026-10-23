import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fab } from '../fab/index.web';
import * as Icons from '../icons';
import { animateMotion } from '../motion/recipes';
import { TabPagerContext, TabPagerItemsContext, type TabPagerContextValue } from './context';
import { barItemsOf, createPageModel } from './pages';
import { TabPagerBottomBar } from './TabPagerBottomBar';
import type { TabPage } from './types';

const PAGES: TabPage[] = [
  { name: 'camera', href: '/camera' },
  { name: 'home', href: '/', preload: true, bar: { label: 'Home', icon: <Icons.RiHomeLine /> } },
  {
    name: 'videos',
    href: '/videos',
    preload: true,
    bar: { label: 'Videos', icon: <Icons.RiVideoLine /> },
  },
  { name: 'you', href: '/you', preload: true, bar: { label: 'You', icon: <Icons.RiUserLine /> } },
];

/**
 * The bar as the provider drives it, without a router: Storybook has no Expo
 * navigator, so the page in front is story state. Pick the camera to watch the
 * bar leave — it draws no item.
 */
function Shell({ page }: { page: string }) {
  const model = useMemo(() => createPageModel(PAGES), []);
  const items = useMemo(() => barItemsOf(PAGES), []);
  const [active, setActive] = useState(page);
  useEffect(() => setActive(page), [page]);
  const activeIndex = model.indexOf(active);
  const progress = useSharedValue(model.barPositions[activeIndex] ?? 0);
  const chromeProgress = useSharedValue(model.chromeHidden[activeIndex] ?? 0);
  useEffect(() => {
    animateMotion(progress, model.barPositions[activeIndex] ?? 0, 'select');
    animateMotion(chromeProgress, model.chromeHidden[activeIndex] ?? 0, 'select');
  }, [model, activeIndex, progress, chromeProgress]);
  const value: TabPagerContextValue = {
    pages: PAGES,
    model,
    activeIndex,
    activePage: active,
    progress,
    chromeProgress,
    selectTab: setActive,
    leaveTab: (_from, to) => setActive(to),
    registerCommitter: () => {},
  };
  return (
    <TabPagerContext.Provider value={value}>
      <TabPagerItemsContext.Provider value={items}>
        <View style={{ height: 220, width: 390, maxWidth: '100%', justifyContent: 'flex-end' }}>
          <TabPagerBottomBar
            action={<Fab icon={Icons.RiQuillPenLine} accessibilityLabel="Compose" />}
          />
        </View>
      </TabPagerItemsContext.Provider>
    </TabPagerContext.Provider>
  );
}

const meta: Meta<typeof Shell> = {
  id: 'base-tab-pager-bottom-bar',
  title: 'Composition/Navigation/Tab Pager Bottom Bar',
  component: Shell,
  args: { page: 'home' },
  argTypes: { page: { control: 'select', options: PAGES.map((page) => page.name) } },
};
export default meta;

export const Default: StoryObj<typeof Shell> = {};
