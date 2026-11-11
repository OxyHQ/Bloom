import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen';
import { Text } from '../typography';
import { AppShell } from './index';

const meta: Meta<typeof AppShell> = {
  id: 'blocks-panel-groups',
  title: 'Composition/Layout/Panel Groups',
  component: AppShell,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

function ReadingPanel({ title, onOpen }: { title: string; onOpen?: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <Screen
      testID={`groups-${title.toLowerCase()}-screen`}
      header={
        <PageHeader
          title={title}
          actions={onOpen ? <Button testID="groups-open" onPress={onOpen}>Likes</Button> : undefined}
        />
      }
    >
      <ScreenScrollView>
        <View className="gap-4 p-4">
          <Button testID={`groups-${title.toLowerCase()}-saved`} onPress={() => setSaved(!saved)}>
            {saved ? 'Saved' : 'Save'}
          </Button>
          {Array.from({ length: 35 }, (_, index) => (
            <Text key={index} className="py-4">{title} paragraph {index + 1}. Each panel keeps its own reading position.</Text>
          ))}
        </View>
      </ScreenScrollView>
    </Screen>
  );
}

export const NestedSplit: Story = {
  render: function NestedSplit() {
    const [open, setOpen] = useState(false);
    return (
      <AppShell
        testID="groups-shell"
        contentMaxWidth="none"
        header={null}
        gutter={8}
        scroll="fixed"
        panelLayout={{
          mode: 'split',
          flow: 'bounded',
          panels: [
            {
              id: 'workspace',
              testID: 'groups-workspace',
              group: {
                mode: 'split',
                axis: 'vertical',
                gap: 8,
                resizeHandle: 'pill',
                panels: [
                  {
                    id: 'main',
                    testID: 'groups-main',
                    resizable: true,
                    content: <ReadingPanel title="Post" onOpen={() => setOpen(true)} />,
                  },
                  {
                    id: 'likes',
                    testID: 'groups-likes',
                    visible: open,
                    floating: {
                      below: 'md',
                      open,
                      onOpenChange: setOpen,
                      placement: 'bottom',
                      label: 'Likes',
                    },
                    headerActions: <Button testID="groups-close" onPress={() => setOpen(false)}>Close likes</Button>,
                    content: <ReadingPanel title="Likes" />,
                  },
                ],
              },
            },
          ],
        }}
      />
    );
  },
};

export const EmailFlow: Story = {
  render: function EmailFlow() {
    const [count, setCount] = useState(3);
    return (
      <AppShell
        testID="flow-shell"
        contentMaxWidth="none"
        header={null}
        gutter={8}
        scroll="fixed"
        panelLayout={{
          mode: 'flow',
          axis: 'vertical',
          header: <PageHeader title="Emails" actions={<Button testID="flow-add" onPress={() => setCount(count + 1)}>Add email</Button>} />,
          panels: Array.from({ length: count }, (_, index) => ({
            id: `email-${index}`,
            testID: `flow-email-${index}`,
            content: (
              <View className="gap-4 p-6">
                <Text>Email {index + 1}</Text>
                {Array.from({ length: index % 2 === 0 ? 5 : 8 }, (_, paragraph) => (
                  <Text key={paragraph}>Message paragraph {paragraph + 1}. Messages add to the common scroll area.</Text>
                ))}
              </View>
            ),
          })),
        }}
      />
    );
  },
};
