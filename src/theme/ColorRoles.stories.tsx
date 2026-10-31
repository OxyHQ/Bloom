import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { BloomColorScope } from './color-scope/ColorScope.web';
import { useTheme } from './use-theme';
import type { AppColorName } from './color-presets';
import { Button } from '../button/index.web';
import { Fab } from '../fab/index.web';
import { Badge } from '../badge';
import { Card } from '../card';
import { AppShell } from '../app-shell/index.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
import { Meter } from '../stat-bar/index.web';
import { PageHeader } from '../page-header';
import { Text } from '../typography';
import {
  RiAddLine,
  RiArrowRightLine,
  RiHomeLine,
  RiFolderLine,
  RiInbox2Line,
  RiSettings3Line,
  RiCheckLine,
} from '../icons/remix';

type PreviewArgs = { preset: AppColorName; direction: 'roles' | 'single-accent' };
const presets = ['cobalt', 'jade', 'olive', 'lagoon'] as const;
const meta: Meta<PreviewArgs> = {
  id: 'foundations-color-roles-in-context',
  title: 'Foundations/Color/Roles in Context',
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
  return (
    <AppShell
      header={null}
      contentMaxWidth="none"
      sidebar={{
        items: nav.map((item) => ({
          ...item,
          key: item.label,
          onPress: () => setSection(item.label),
        })),
        secondaryItems: [
          {
            key: 'Settings',
            label: 'Settings',
            icon: RiSettings3Line,
            onPress: () => setSection('Settings'),
          },
        ],
        selected: section,
        showSearch: false,
        showThemeToggle: false,
      }}
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        panels: [
          {
            id: 'workspace',
            content: (
              <Screen
                header={
                  <PageHeader
                    title={section}
                    actions={
                      <Button
                        tone="neutral"
                        appearance="plain"
                        icon={RiInbox2Line}
                        accessibilityLabel="Open inbox"
                        onPress={() => setSection('Inbox')}
                      />
                    }
                  />
                }
              >
                <ScreenScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 20,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
                      <Text
                        style={{
                          fontSize: 28,
                          lineHeight: 34,
                          fontWeight: '600',
                          color: colors.text,
                        }}
                      >
                        Room for good ideas.
                      </Text>
                      <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
                        {updates} updates from your team. Your next idea starts here.
                      </Text>
                    </View>
                    <Fab
                      label="New update"
                      icon={RiAddLine}
                      tone={action}
                      size="sm"
                      onPress={() => setUpdates((value) => value + 1)}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    <Card
                      appearance="solid"
                      elevation="none"
                      radius="radius-20"
                      style={{ flex: 2, minWidth: 240, padding: 24, gap: 20 }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                          Website refresh
                        </Text>
                        <Badge content="In progress" tone={support} appearance="subtle" />
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                        A clearer home for everything we are building. The project update is ready
                        for a closer look.
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <Badge content="Design" tone={support} appearance="subtle" />
                        <Badge content="Due Friday" tone="neutral" appearance="subtle" />
                      </View>
                      <Meter value={65} max={100} accessibilityLabel="Website refresh" />
                      <Button
                        appearance="plain"
                        tone="accent"
                        trailingIcon={RiArrowRightLine}
                        onPress={() => setSection('Projects')}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Open project
                      </Button>
                    </Card>
                    <Card
                      tone={support}
                      appearance="subtle"
                      radius="radius-20"
                      style={{ flex: 1, minWidth: 220, padding: 24, gap: 16 }}
                    >
                      <Text
                        style={{
                          color:
                            direction === 'roles'
                              ? colors.secondarySubtleForeground
                              : colors.textSecondary,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        A LITTLE MOMENTUM
                      </Text>
                      <Text
                        style={{
                          color:
                            direction === 'roles' ? colors.secondarySubtleForeground : colors.text,
                          fontSize: 40,
                          fontWeight: '600',
                        }}
                      >
                        12
                      </Text>
                      <Text
                        style={{
                          color:
                            direction === 'roles'
                              ? colors.secondarySubtleForeground
                              : colors.textSecondary,
                          fontSize: 14,
                          lineHeight: 21,
                        }}
                      >
                        Ideas turned into something real this week.
                      </Text>
                      <Badge
                        content="+4 this week"
                        tone="success"
                        appearance="subtle"
                        style={{ alignSelf: 'flex-start' }}
                      />
                    </Card>
                  </View>
                  <View style={{ gap: 14 }}>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                      Next up
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Button
                        icon={RiCheckLine}
                        accessibilityLabel={done ? 'Reopen review task' : 'Complete review task'}
                        appearance={done ? 'subtle' : 'plain'}
                        tone={done ? 'success' : 'neutral'}
                        onPress={() => setDone((value) => !value)}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 14,
                            textDecorationLine: done ? 'line-through' : 'none',
                          }}
                        >
                          Review the project update
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                          Maya · Today at 14:00
                        </Text>
                      </View>
                      <Badge
                        content={done ? 'Done' : 'Today'}
                        tone={done ? 'success' : support}
                        appearance="subtle"
                      />
                    </View>
                  </View>
                </ScreenScrollView>
              </Screen>
            ),
          },
        ],
      }}
    />
  );
}

export const FirstDirection: StoryObj<PreviewArgs> = {
  name: 'Semantic roles and a single accent',
  render: function Render(args) {
    const [, updateArgs] = useArgs<PreviewArgs>();
    return <ColorRolesPreview args={args} updateArgs={updateArgs} />;
  },
};

function ColorRolesPreview({
  args,
  updateArgs,
}: {
  args: PreviewArgs;
  updateArgs: (args: Partial<PreviewArgs>) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        padding: 16,
        gap: 18,
        width: '100%',
        backgroundColor: colors.background,
      }}
    >
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          Semantic roles in a composed screen
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((preset) => (
            <Button
              key={preset}
              size="sm"
              tone="neutral"
              appearance={args.preset === preset ? 'subtle' : 'plain'}
              pressed={args.preset === preset}
              onPress={() => updateArgs({ preset })}
            >
              {preset}
            </Button>
          ))}
          <View style={{ width: 8 }} />
          <Button
            size="sm"
            tone="neutral"
            appearance={args.direction === 'roles' ? 'subtle' : 'plain'}
            pressed={args.direction === 'roles'}
            onPress={() => updateArgs({ direction: 'roles' })}
          >
            Color roles
          </Button>
          <Button
            size="sm"
            tone="neutral"
            appearance={args.direction === 'single-accent' ? 'subtle' : 'plain'}
            pressed={args.direction === 'single-accent'}
            onPress={() => updateArgs({ direction: 'single-accent' })}
          >
            Single accent
          </Button>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Identity uses primary / tone=accent, support uses secondary / tone=support, and action
          uses tertiary / tone=action. Single accent keeps the same components while assigning
          actions to identity and support to neutral. BloomColorScope changes the local preset;
          light and dark still follow the toolbar.
        </Text>
        <Button
          href="./?path=/story/foundations-color-system-playground--playground"
          target="_top"
          size="sm"
          tone="neutral"
          appearance="outline"
          style={{ alignSelf: 'flex-start' }}
        >
          Explore registered presets
        </Button>
      </View>
      <BloomColorScope colorPreset={args.preset} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Workspace direction={args.direction} />
      </BloomColorScope>
    </View>
  );
}
