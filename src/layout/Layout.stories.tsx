import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BottomEdgeProvider } from './bottom-edge';
import { Fab } from '../fab';
import * as Icons from '../icons';
import { TabBar, TabBarButton } from '../tab-bar';
import type { TabBarItem } from '../tab-bar/types';

/**
 * The bottom edge, rendered — which is the point. Jest sees that the FAB's
 * `bottom` is a bigger number; only a browser shows you that the pill is clear
 * of the gesture handle and that the FAB is above the bar rather than inside its
 * blur band.
 *
 * Both stories render the SAME tree under a simulated gesture-navigation inset.
 * The only difference is whether the registry is mounted, so the frame is a
 * before/after of the bug this family was written for.
 */
const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: <Icons.Home_Stroke2_Corner0_Rounded size="lg" /> },
  { name: 'search', label: 'Search', icon: <Icons.MagnifyingGlass_Stroke2_Corner0_Rounded size="lg" /> },
  { name: 'you', label: 'You', icon: <Icons.PersonCheck_Stroke2_Corner0_Rounded size="lg" /> },
];

/** An Android device navigating by gestures — the band the handle is drawn in. */
const GESTURE_HANDLE_INSET = 24;

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaInsetsContext.Provider
      value={{ top: 0, right: 0, bottom: GESTURE_HANDLE_INSET, left: 0 }}
    >
      <View
        style={{
          width: 320,
          height: 560,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#888',
          backgroundColor: '#f4f4f5',
          justifyContent: 'flex-end',
        }}
      >
        {children}
        {/* The OS gesture handle, drawn where Android draws it: inside the
            reserved band. Anything overlapping this bar is on top of a system
            control. */}
        <View style={{ height: GESTURE_HANDLE_INSET, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 108, height: 4, borderRadius: 2, backgroundColor: '#111' }} />
        </View>
      </View>
    </SafeAreaInsetsContext.Provider>
  );
}

function Screen() {
  return (
    <>
      <Fab
        placement="bottom-right"
        onPress={() => {}}
        accessibilityLabel="Compose"
        icon={<Icons.PlusLarge_Stroke2_Corner0_Rounded size="lg" fill="#fff" />}
      />
      <TabBar activeIndex={0} onIndexChange={() => {}}>
        {ITEMS.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} />
        ))}
      </TabBar>
    </>
  );
}

const meta: Meta<typeof BottomEdgeProvider> = {
  title: 'Layout/Bottom edge',
  component: BottomEdgeProvider,
};

export default meta;
type Story = StoryObj<typeof BottomEdgeProvider>;

/** The FAB reads the bar's claim and stacks above it. */
export const Registered: Story = {
  render: () => (
    <Phone>
      <BottomEdgeProvider>
        <Screen />
      </BottomEdgeProvider>
    </Phone>
  ),
};

/**
 * The same tree with no registry — how it shipped. The FAB anchors 16px off the
 * edge and lands behind the bar, inside its blur band. No z-index fixes it: the
 * bar is the last sibling and paints over everything before it.
 */
export const Unregistered: Story = {
  render: () => (
    <Phone>
      <Screen />
      <Text style={{ position: 'absolute', top: 8, left: 12, fontSize: 11 }}>
        no BottomEdgeProvider
      </Text>
    </Phone>
  ),
};
