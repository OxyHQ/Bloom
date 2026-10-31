import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { AppShell } from '../src/app-shell';
import { RiHomeLine, RiTimeLine } from '../src/icons/remix';
import { PageHeader } from '../src/page-header';
import { Screen, ScreenScrollView, useScreen } from '../src/screen';
import { TabBar, TabBarButton } from '../src/tab-bar';
import { TextField, TextFieldInput } from '../src/text-field';
import { Text } from '../src/typography';

const meta: Meta = {
  title: 'Composition/Contract probes',
  id: 'composition-contract-probes',
  parameters: {
    layout: 'fullscreen',
    bloomScroll: 'document',
    controls: { disable: true },
  },
};
export default meta;

function Rows() {
  return Array.from({ length: 40 }, (_, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: Immutable synthetic rows never reorder.
    <View key={index} style={{ minHeight: 64, padding: 16 }}>
      <Text>Synthetic row {index + 1}</Text>
    </View>
  ));
}

/** Visible diagnostic of the public signal, never a second scroll driver. */
function CollapseMeter() {
  const { collapseProgress } = useScreen();
  const style = useAnimatedStyle(
    () => ({ width: 90 * collapseProgress.value, height: 4 }),
    [collapseProgress],
  );
  return <Animated.View testID="contract-collapse-meter" style={style} />;
}

function CollapseBar() {
  const { collapseProgress } = useScreen();
  return (
    <TabBar activeIndex={0} minimizeProgress={collapseProgress} testID="contract-bottom-bar">
      <TabBarButton index={0} item={{ name: 'first', label: 'First', icon: <RiHomeLine /> }} />
      <TabBarButton index={1} item={{ name: 'second', label: 'Second', icon: <RiTimeLine /> }} />
    </TabBar>
  );
}

export const ContinuousChrome: StoryObj = {
  render: () => (
    <Screen
      documentScroll
      testID="contract-route"
      header={<PageHeader title="Continuous chrome" presentation="bar" />}
      bottomBar={<CollapseBar />}
    >
      <ScreenScrollView>
        <CollapseMeter />
        <Rows />
      </ScreenScrollView>
    </Screen>
  ),
};

function NavigationContent() {
  const [draft, setDraft] = useState('Synthetic draft');
  return (
    <View testID="contract-navigation" style={{ padding: 12, gap: 12 }}>
      <Text>Navigation</Text>
      <TextField>
        <TextFieldInput
          label="Navigation draft"
          accessibilityLabel="Navigation draft"
          value={draft}
          onChangeText={setDraft}
        />
      </TextField>
      <Text>First destination</Text>
      <Text>Second destination</Text>
    </View>
  );
}

export const InlineCompactNavigation: StoryObj = {
  render: () => (
    <AppShell
      testID="contract-shell"
      variant="feed"
      scroll="document"
      header={null}
      navFrom={900}
      framedFrom={500}
      gutter={8}
      contentWidth={1440}
      contentMaxWidth="none"
      navigationGap={0}
      sidebar={{
        width: 248,
        variant: 'panel',
        collapsed: false,
        surface: 'plain',
        render: () => <NavigationContent />,
      }}
      panelLayout={{
        flow: 'document',
        panels: [
          {
            id: 'main',
            content: (
              <Screen
                documentScroll
                testID="contract-panel-route"
                header={<PageHeader title="Synthetic workspace" presentation="bar" />}
              >
                <ScreenScrollView>
                  <Rows />
                </ScreenScrollView>
              </Screen>
            ),
          },
        ],
      }}
    />
  ),
};
