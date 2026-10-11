import { Text } from '../typography';
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Screen, ScreenScrollView } from './index';
import { PageHeader } from '../page-header';
import { AppShell } from '../app-shell';

const meta: Meta<typeof Screen> = { title: 'Foundations/Screen', component: Screen };
export default meta;
type Story = StoryObj<typeof Screen>;
export const ContinuousContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ height: 600, maxWidth: 420 }}>
      <Screen header={<PageHeader title="A continuous canvas" />}>
        <ScreenScrollView>
          {Array.from({ length: 24 }, (_, index) => (
            <View key={index} style={{ padding: 20 }}>
              <Text>Row {index + 1}</Text>
            </View>
          ))}
        </ScreenScrollView>
      </Screen>
    </View>
  ),
};

export const Playground: StoryObj<typeof Screen> = {
  args: { active: true, contentClearance: 16 },
  parameters: { controls: { disable: false, include: ['active', 'contentClearance'] } },
  argTypes: {
    active: { control: 'boolean' },
    contentClearance: { control: { type: 'range', min: 0, max: 64 } },
  },
  render: function Playground(args) {
    return (
      <View style={{ width: 520, maxWidth: '100%' }}>
        <View style={{ height: 500 }}>
          <Screen {...args} header={<PageHeader title="A continuous canvas" />}>
            <ScreenScrollView>
              {Array.from({ length: 20 }, (_, index) => (
                <View key={index} style={{ padding: 20 }}>
                  <Text>Row {index + 1}</Text>
                </View>
              ))}
            </ScreenScrollView>
          </Screen>
        </View>
      </View>
    );
  },
};

/** A route paints the same surface as its shell and has one sticky header owner. */
export const DocumentPanel: Story = {
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
  render: () => (
    <AppShell
      variant="feed"
      scroll="document"
      panel
      header={null}
      gutter={8}
      contentWidth={1100}
      testID="document-shell"
    >
      <Screen
        documentScroll
        testID="document-route"
        header={<PageHeader title="A continuous panel" testID="document-header" />}
      >
        {Array.from({ length: 40 }, (_, index) => (
          <View key={index} style={{ padding: 24 }}>
            <Text>Row {index + 1}</Text>
          </View>
        ))}
      </Screen>
    </AppShell>
  ),
};
