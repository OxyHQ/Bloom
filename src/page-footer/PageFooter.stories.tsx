import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from '../bottom-bar/index.web';
import { Button } from '../button/index.web';
import { RiInbox2Line, RiSearchLine } from '../icons/remix';
import { BottomEdgeProvider, useBottomEdgeInset } from '../layout';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PageFooter, PageFooterProvider, usePageFooterInset } from './index';
import type { PageFooterProps } from './types';

const meta: Meta<typeof PageFooter> = {
  title: 'Blocks/Page Footer',
  component: PageFooter,
  args: { safeArea: false, scrim: 'always' },
  argTypes: { scrim: { control: 'select', options: ['always', 'none'] } },
};
export default meta;
type Story = StoryObj<typeof PageFooter>;

function MessagePane({ footer, navigation, longLabels }: {
  footer: PageFooterProps;
  navigation: boolean;
  longLabels: boolean;
}) {
  const { colors } = useTheme();
  const clearance = usePageFooterInset();
  const occupied = useBottomEdgeInset();
  const [lastAction, setLastAction] = useState('None');
  const [showActions, setShowActions] = useState(true);
  const [destination, setDestination] = useState('inbox');
  return <View style={{ flex: 1, minHeight: 0 }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: clearance || occupied }}>
      <View style={{ padding: 24, gap: 20 }}>
        <Text variant="headline-semibold">The next chapter</Text>
        <Text>Last action: {lastAction}</Text>
        <Button onPress={() => setShowActions(value => !value)}>
          {showActions ? 'Hide page actions' : 'Show page actions'}
        </Button>
        {Array.from({ length: 12 }, (_, index) => <View key={index} style={{ gap: 8 }}>
          <Text variant="body-medium">Message paragraph {index + 1}</Text>
          <Text style={{ color: colors.textSecondary }}>
            The conversation continues behind the floating controls. Scroll to the end:
            the final paragraph can move fully above the actions and navigation.
          </Text>
        </View>)}
        <Text variant="body-medium">End of message — this line remains reachable.</Text>
      </View>
    </ScrollView>
    {showActions ? <PageFooter {...footer} actions={footer.actions ?? <>
      <Button onPress={() => setLastAction('Reply')}>{longLabels ? 'Reply to this message' : 'Reply'}</Button>
      <Button onPress={() => setLastAction('Reply all')}>{longLabels ? 'Reply to all participants' : 'Reply all'}</Button>
      <Button onPress={() => setLastAction('Forward')}>{longLabels ? 'Forward this message' : 'Forward'}</Button>
    </>} /> : null}
    {navigation ? <BottomBar
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      items={[{ name: 'inbox', label: 'Inbox', icon: <RiInbox2Line /> }, { name: 'search', label: 'Search', icon: <RiSearchLine /> }]}
      value={destination}
      onValueChange={setDestination}
    /> : null}
  </View>;
}

function Preview({ footer, width = 600, navigation = false, longLabels = false }: {
  footer: PageFooterProps;
  width?: number;
  navigation?: boolean;
  longLabels?: boolean;
}) {
  const { colors } = useTheme();
  return <SafeAreaInsetsContext.Provider value={{ top: 0, left: 0, right: 0, bottom: navigation ? 34 : 0 }}>
    <BottomEdgeProvider><PageFooterProvider>
      <SurfaceLevelProvider level={1} fill={colors.card}>
        <View style={{ width, maxWidth: '100%', height: 560, overflow: 'hidden', backgroundColor: colors.card }}>
          <MessagePane footer={footer} navigation={navigation} longLabels={longLabels} />
        </View>
      </SurfaceLevelProvider>
    </PageFooterProvider></BottomEdgeProvider>
  </SafeAreaInsetsContext.Provider>;
}

export const FloatingOverMessage: Story = { render: args => <Preview footer={args} /> };
export const AboveNavigation: Story = { render: args => <Preview footer={args} width={390} navigation /> };
export const WrappedActions: Story = { render: args => <Preview footer={args} width={320} longLabels navigation /> };
