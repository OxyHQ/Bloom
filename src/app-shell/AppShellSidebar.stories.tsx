import { useArgs } from 'storybook/preview-api';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiCalendarLine, RiHomeLine, RiSettings3Line } from '../icons/remix';
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen/index.web';
import type { SidebarSize, SidebarSurface, SidebarVariant } from '../sidebar/types';
import { Text } from '../typography';
import { StoryWindow } from '../window/WindowControls.stories';
import { AppShell } from './index.web';
import type { AppShellSidebarProps } from './types';

type PlaygroundArgs = {
  variant: SidebarVariant;
  surface: SidebarSurface;
  size: SidebarSize;
  collapsed: boolean;
  railLabels: 'visible' | 'hidden';
  railSelection: 'pill' | 'icon';
  railWidth: number;
  window: 'web' | 'oxyos';
  fullscreen: boolean;
  controls: 'bloom' | 'platform';
};

const meta: Meta<PlaygroundArgs> = {
  id: 'composition-app-shell-sidebar-playground',
  title: 'Composition/Layout/App Shell/Sidebar Playground',
  parameters: {
    layout: 'fullscreen',
    // Dynamic JSX serialization walks React's owner tree inside panel content
    // after an args update. Show the public composition recipe instead.
    docs: {
      source: {
        type: 'code',
        code: `function Workspace() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AppShell
      header={null}
      sidebar={{
        items: navigationItems,
        surface: 'docked',
        size: 'md',
        collapsed,
        onCollapsedChange: setCollapsed,
      }}
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        panels: [{
          id: 'main',
          content: (
            <Screen header={<PageHeader title="Home" />}>
              <ScreenScrollView>{children}</ScreenScrollView>
            </Screen>
          ),
        }],
      }}
    />
  );
}`,
      },
    },
  },
  args: {
    variant: 'panel',
    surface: 'docked',
    size: 'md',
    collapsed: false,
    window: 'oxyos',
    fullscreen: false,
    controls: 'bloom',
    railLabels: 'visible',
    railSelection: 'pill',
    railWidth: 80,
  },
  argTypes: {
    variant: { control: 'select', options: ['panel', 'rail'] },
    surface: { control: 'select', options: ['card', 'plain', 'docked'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    collapsed: { control: 'boolean' },
    railLabels: { control: 'inline-radio', options: ['visible', 'hidden'] },
    railSelection: { control: 'inline-radio', options: ['pill', 'icon'] },
    railWidth: { control: { type: 'range', min: 64, max: 120, step: 4 } },
    window: { control: 'select', options: ['web', 'oxyos'] },
    fullscreen: { control: 'boolean' },
    controls: { control: 'inline-radio', options: ['bloom', 'platform'] },
  },
};
export default meta;
type Story = StoryObj<PlaygroundArgs>;

/** Compare the real sidebar in the shell. The shell reserves window controls' room as its geometry changes. */
export const Playground: Story = {
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return (
      <SidebarPreview args={args} onCollapsedChange={(collapsed) => updateArgs({ collapsed })} />
    );
  },
};

/** The same sidebar with AppShell's own Screen and scroll owner. */
export const Adaptive: Story = {
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: `<AppShell
  scroll="auto"
  sidebar={sidebar}
  header={<PageHeader title="Home" />}
>
  {children}
</AppShell>`,
      },
    },
  },
  render: function Adaptive(args) {
    const [, updateArgs] = useArgs();
    return (
      <SidebarPreview
        args={args}
        composition="adaptive"
        onCollapsedChange={(collapsed) => updateArgs({ collapsed })}
      />
    );
  },
};

function SidebarPreview({
  args,
  onCollapsedChange,
  composition = 'panels',
}: {
  args: PlaygroundArgs;
  composition?: 'panels' | 'adaptive';
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const [selected, setSelected] = useState<'home' | 'calendar' | 'settings'>('home');
  const { width } = useWindowDimensions();
  const title = { home: 'Home', calendar: 'Calendar', settings: 'Settings' }[selected];
  const sidebar: AppShellSidebarProps = {
    variant: args.variant,
    surface: args.surface,
    size: args.size,
    collapsed: args.collapsed,
    railLabels: args.railLabels,
    railSelection: args.railSelection,
    railWidth: args.railWidth,
    onCollapsedChange,
    items: [
      { key: 'home', label: 'Home', icon: RiHomeLine, onPress: () => setSelected('home') },
      {
        key: 'calendar',
        label: 'Calendar',
        icon: RiCalendarLine,
        onPress: () => setSelected('calendar'),
      },
    ],
    secondaryItems: [
      {
        key: 'settings',
        label: 'Settings',
        icon: RiSettings3Line,
        onPress: () => setSelected('settings'),
      },
    ],
    selected,
    showSearch: false,
    showThemeToggle: false,
  };
  const body = (
    <View style={{ padding: 24 }}>
      <Text>{title}: change the sidebar and window options to compare the shared layout.</Text>
    </View>
  );
  const shell =
    composition === 'adaptive' ? (
      <AppShell
        testID="sidebar-playground"
        scroll="auto"
        navigationPlacement={args.variant === 'rail' ? 'rail' : 'sidebar'}
        sidebar={sidebar}
        header={<PageHeader title={title} />}
      >
        {body}
      </AppShell>
    ) : (
      <AppShell
        testID="sidebar-playground"
        header={null}
        navigationAlign="content"
        navFrom={0}
        framedFrom={0}
        contentMaxWidth="none"
        sidebar={sidebar}
        panelLayout={{
          mode: 'split',
          flow: 'bounded',
          panels: [
            {
              id: 'main',
              content: (
                <Screen scroll="auto" header={<PageHeader title={title} />}>
                  <ScreenScrollView>{body}</ScreenScrollView>
                </Screen>
              ),
            },
          ],
        }}
      />
    );
  return args.window === 'oxyos' ? (
    <View style={{ padding: 24 }}>
      <StoryWindow
        width={Math.min(1100, Math.max(0, width - 48))}
        height={640}
        fullscreen={args.fullscreen}
        controls={args.controls}
      >
        {shell}
      </StoryWindow>
    </View>
  ) : (
    <View style={{ height: 640 }}>{shell}</View>
  );
}
