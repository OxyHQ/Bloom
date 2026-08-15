import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Card } from '../card';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { ScrollRestorationProvider, useScrollRestoration } from './index';
import type { ScreenFocusEffect, ScrollRouterAdapter } from './types';

/**
 * Scroll restoration has no appearance of its own: the only way to see it is to
 * scroll something, leave, come back, and find yourself where you were. So this
 * story is a two-screen navigator, and the assertion is what the offset readout
 * says after a round trip.
 *
 * The screens are HIDDEN rather than unmounted when they lose focus, because
 * that is what the (expo-router-wrapped) web stack does — and it is the reason
 * the restore is a bounded run of frames rather than a single write: while
 * hidden a container collapses, its `scrollTop` is forced to 0, and a
 * single-frame restore would be clamped away before the content came back.
 *
 * The ADAPTER is the other half. `scroll/` imports no router; this story
 * supplies its own adapter over React context, exactly as a Vite/SPA consumer
 * would for its own router, which is also a demonstration that the core is
 * genuinely router-agnostic.
 */
const meta: Meta = {
  title: 'Foundations/Scroll restoration',
};

export default meta;

type Story = StoryObj;

interface ScreenState {
  /** What the screen is SHOWING — the offset is keyed on this, not on history. */
  contentId: string;
  focused: boolean;
}

const ScreenContext = createContext<ScreenState>({ contentId: 'none', focused: false });

/**
 * A router adapter for this story, and a module-level CONSTANT as the contract
 * requires: both members are hooks, so a value that changed identity would
 * change the hook order of everything below the provider.
 */
const storyAdapter: ScrollRouterAdapter = {
  useScreenContentId(): string | null {
    return useContext(ScreenContext).contentId;
  },
  useScreenFocusEffect(effect: ScreenFocusEffect): void {
    const { focused } = useContext(ScreenContext);
    useEffect(() => {
      if (!focused) return undefined;
      return effect();
    }, [focused, effect]);
  },
};

const ROWS = Array.from({ length: 40 }, (_, index) => index);

function ScreenBody({ label }: { label: string }) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView | null>(null);
  const [offset, setOffset] = useState(0);
  const scroll = useScrollRestoration(ref);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600' }}>
        {label} — offset {Math.round(offset)}px
      </Text>
      <ScrollView
        ref={ref}
        // Bloom's binding is what records the offset on NATIVE; on web it is a
        // stable no-op (the hook subscribes to the DOM node itself), and passing
        // it anyway is what lets one call site run on both platforms.
        onScroll={(event) => {
          scroll.onScroll(event);
          setOffset(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        style={{
          height: 220,
          width: 260,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {ROWS.map((row) => (
          <View
            key={row}
            style={{
              height: 44,
              justifyContent: 'center',
              paddingHorizontal: 12,
              backgroundColor: row % 2 === 0 ? colors.background : colors.backgroundSecondary,
            }}
          >
            <Text>
              {label} row {row}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Screen({ contentId, label, focused }: { contentId: string; label: string; focused: boolean }) {
  const state = useMemo(() => ({ contentId, focused }), [contentId, focused]);
  return (
    <ScreenContext.Provider value={state}>
      {/* Hidden, not unmounted — the background screen a web stack keeps alive. */}
      <View style={{ display: focused ? 'flex' : 'none' }}>
        <ScreenBody label={label} />
      </View>
    </ScreenContext.Provider>
  );
}

function Navigator() {
  const [active, setActive] = useState('feed');
  // Bumping this hands the profile screen a content id it has never shown
  // before — the "unseen content" case, which must open at the TOP rather than
  // inherit whatever the previous screen left behind.
  const [profileVisit, setProfileVisit] = useState(0);
  const profileId = `profile:${profileVisit}`;

  return (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Card variant="outlined" radius="radius-16" style={{ padding: 14, gap: 6, maxWidth: 430 }}>
        <Text style={{ fontWeight: '600' }}>Scroll one screen, switch, switch back.</Text>
        <Text style={{ fontSize: 13, opacity: 0.75 }}>
          The offset comes back because it is keyed on the CONTENT the screen shows, not on the
          navigation entry — so it survives however you return. “New profile” gives the profile
          screen content it has not shown this session: unseen content opens at the top, and it is
          written there explicitly, because one document scroller is shared by every route.
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button variant={active === 'feed' ? 'primary' : 'secondary'} onPress={() => setActive('feed')}>
          Feed
        </Button>
        <Button
          variant={active === 'profile' ? 'primary' : 'secondary'}
          onPress={() => setActive('profile')}
        >
          Profile
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            setProfileVisit((visit) => visit + 1);
            setActive('profile');
          }}
        >
          New profile
        </Button>
      </View>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Screen contentId="feed" label="Feed" focused={active === 'feed'} />
        <Screen contentId={profileId} label={`Profile #${profileVisit}`} focused={active === 'profile'} />
      </View>
    </View>
  );
}

/**
 * Restoring an offset across a round trip, which is the whole feature.
 *
 * What to look for, in order: scroll the Feed to ~400px, switch to Profile,
 * switch back — the readout returns to ~400. Then press “New profile”: the
 * profile screen opens at 0 even though the previous one was scrolled, which is
 * the RESET half. Returning to the same profile again restores it instead.
 */
export const RestoresAnOffset: Story = {
  render: () => (
    <ScrollRestorationProvider adapter={storyAdapter}>
      <Navigator />
    </ScrollRestorationProvider>
  ),
};
