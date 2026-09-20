import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { BloomColorScope } from './color-scope/ColorScope.web';
import { useTheme } from './use-theme';
import type { AppColorName } from './color-presets';
import { Button } from '../button/index.web';
import { Fab } from '../fab/index.web';
import { Badge } from '../badge';
import { Card } from '../card';
import { SidebarItem } from '../sidebar';
import { PageHeader } from '../page-header';
import { Text } from '../typography';
import { RiAddLine, RiArrowRightLine, RiHomeLine, RiFolderLine, RiInbox2Line, RiSettings3Line, RiCheckLine } from '../icons/remix';

type PreviewArgs = { preset: AppColorName; direction: 'roles' | 'single-accent' };
const presets = ['cobalt', 'jade', 'olive', 'lagoon'] as const;
const meta: Meta<PreviewArgs> = {
  title: 'Foundations/Color roles in context',
  parameters: { layout: 'fullscreen' },
  args: { preset: 'cobalt', direction: 'roles' },
  argTypes: {
    preset: { control: 'select', options: presets },
    direction: { control: 'inline-radio', options: ['roles', 'single-accent'] },
  },
};
export default meta;

function Workspace({ direction }: Pick<PreviewArgs, 'direction'>) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [section, setSection] = useState('Overview');
  const [updates, setUpdates] = useState(3);
  const [done, setDone] = useState(false);
  const action = direction === 'roles' ? 'action' : 'accent';
  const support = direction === 'roles' ? 'support' : 'neutral';
  const nav = [
    { label: 'Overview', icon: RiHomeLine },
    { label: 'Projects', icon: RiFolderLine },
    { label: 'Inbox', icon: RiInbox2Line },
  ];
  return <View style={{ backgroundColor: colors.background, minHeight: 650, flexDirection: 'row', borderRadius: 28, overflow: 'hidden' }}>
    {!compact && <View style={{ width: 210, padding: 20, gap: 24, backgroundColor: colors.backgroundSecondary }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primarySubtleForeground }}>bloom studio</Text>
      <View style={{ gap: 6 }}>
        {nav.map(item => <SidebarItem key={item.label} {...item} selected={section === item.label} onPress={() => setSection(item.label)} />)}
      </View>
      <View style={{ flex: 1 }} />
      <SidebarItem label="Settings" icon={RiSettings3Line} selected={section === 'Settings'} onPress={() => setSection('Settings')} />
    </View>}
    <View style={{ flex: 1, minWidth: 0, padding: compact ? 16 : 28, gap: 24 }}>
      <PageHeader title={section} actions={<Button tone="neutral" appearance="plain" icon={RiInbox2Line} accessibilityLabel="Open inbox" onPress={() => setSection('Inbox')} />} />
      {compact && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {nav.map(item => <Button key={item.label} appearance={section === item.label ? 'subtle' : 'plain'} tone={section === item.label ? 'accent' : 'neutral'} onPress={() => setSection(item.label)}>{item.label}</Button>)}
      </View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
          <Text style={{ fontSize: 28, lineHeight: 34, fontWeight: '600', color: colors.text }}>Room for good ideas.</Text>
          <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>{updates} updates from your team. Your next idea starts here.</Text>
        </View>
        <Fab label="New update" icon={RiAddLine} tone={action} size="sm" onPress={() => setUpdates(value => value + 1)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Card appearance="solid" elevation="none" radius="radius-20" style={{ flex: 2, minWidth: compact ? 240 : 300, padding: 24, gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>Website refresh</Text>
            <Badge content="In progress" tone={support} appearance="subtle" />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>A clearer home for everything we are building. The first direction is ready for a closer look.</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Badge content="Design" tone={support} appearance="subtle" />
            <Badge content="Due Friday" tone="neutral" appearance="subtle" />
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.primarySubtle }}>
            <View style={{ width: '65%', height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
          </View>
          <Button appearance="plain" tone="accent" trailingIcon={RiArrowRightLine} onPress={() => setSection('Projects')} style={{ alignSelf: 'flex-start' }}>Open project</Button>
        </Card>
        <Card tone={support} appearance="subtle" radius="radius-20" style={{ flex: 1, minWidth: 220, padding: 24, gap: 16 }}>
          <Text style={{ color: direction === 'roles' ? colors.secondarySubtleForeground : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>A LITTLE MOMENTUM</Text>
          <Text style={{ color: direction === 'roles' ? colors.secondarySubtleForeground : colors.text, fontSize: 40, fontWeight: '600' }}>12</Text>
          <Text style={{ color: direction === 'roles' ? colors.secondarySubtleForeground : colors.textSecondary, fontSize: 14, lineHeight: 21 }}>Ideas turned into something real this week.</Text>
          <Badge content="+4 this week" tone="success" appearance="subtle" style={{ alignSelf: 'flex-start' }} />
        </Card>
      </View>
      <View style={{ gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>Next up</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Button icon={RiCheckLine} accessibilityLabel={done ? 'Reopen review task' : 'Complete review task'} appearance={done ? 'subtle' : 'plain'} tone={done ? 'success' : 'neutral'} onPress={() => setDone(value => !value)} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.text, fontSize: 14, textDecorationLine: done ? 'line-through' : 'none' }}>Review the first direction</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Maya · Today at 14:00</Text>
          </View>
          <Badge content={done ? 'Done' : 'Today'} tone={done ? 'success' : support} appearance="subtle" />
        </View>
      </View>
    </View>
  </View>;
}

export const FirstDirection: StoryObj<PreviewArgs> = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<PreviewArgs>();
    const { colors } = useTheme();
    return <View style={{ padding: 16, gap: 18, width: '100%', backgroundColor: colors.background }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Color roles · first direction</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {presets.map(preset => <Button key={preset} size="sm" tone="neutral" appearance={args.preset === preset ? 'subtle' : 'plain'} onPress={() => updateArgs({ preset })}>{preset}</Button>)}
          <View style={{ width: 8 }} />
          <Button size="sm" tone="neutral" appearance={args.direction === 'roles' ? 'subtle' : 'plain'} onPress={() => updateArgs({ direction: 'roles' })}>Color roles</Button>
          <Button size="sm" tone="neutral" appearance={args.direction === 'single-accent' ? 'subtle' : 'plain'} onPress={() => updateArgs({ direction: 'single-accent' })}>Single accent</Button>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Switch palettes and compare the same components. Light / dark follows the Storybook toolbar.</Text>
      </View>
      <BloomColorScope colorPreset={args.preset}><Workspace direction={args.direction} /></BloomColorScope>
    </View>;
  },
};
