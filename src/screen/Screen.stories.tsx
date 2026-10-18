import { Text } from '../typography';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Screen, ScreenScrollView } from './index';
import { Button } from '../button';
import { PageFooter } from '../page-footer';
import { PageHeader } from '../page-header';
import { AppShell, AppShellPanel } from '../app-shell';

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
      panels
      header={null}
      gutter={8}
      contentWidth={1100}
      testID="document-shell"
    >
      <AppShellPanel>
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
      </AppShellPanel>
    </AppShell>
  ),
};

/**
 * The page every app writes once for both platforms: the window scrolls it on
 * web, its own scroll view on native, and `onEndReached` pages it either way.
 */
export const DocumentScrollView: Story = {
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
  render: function DocumentScrollView() {
    const [pages, setPages] = React.useState(1);
    return (
      <Screen
        documentScroll
        testID="document-page"
        header={<PageHeader title={`Pages loaded: ${pages}`} testID="document-page-title" />}
      >
        <ScreenScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          onEndReached={() => setPages((count) => Math.min(count + 1, 5))}
          onEndReachedThreshold={0.5}
        >
          {Array.from({ length: pages * 20 }, (_, index) => (
            <View key={index} style={{ padding: 20 }} testID={`document-row-${index + 1}`}>
              <Text>Row {index + 1}</Text>
            </View>
          ))}
        </ScreenScrollView>
      </Screen>
    );
  },
};

/** One screen declaration survives document and bounded panel hosts. */
export const DeclarativeHost: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => {
    const [document, setDocument] = useState(false);
    return (
      <View style={{ height: 680 }}>
        <AppShell
          testID="declarative-shell"
          panelLayout={{
            flow: document ? 'document' : 'bounded',
            panels: [
              {
                id: 'conversation',
                headerActions: (
                  <Button
                    testID="declarative-toggle"
                    onPress={() => setDocument((value) => !value)}
                  >
                    Change host
                  </Button>
                ),
                content: (
                  <Screen
                    scroll="auto"
                    testID="declarative-screen"
                    header={<PageHeader title="Conversation" />}
                    bottomBar={
                      <PageFooter testID="declarative-footer" actions={<Button>Reply</Button>} />
                    }
                  >
                    <ScreenScrollView testID="declarative-body">
                      <View testID="declarative-content" style={{ padding: 20, gap: 16 }}>
                        {Array.from({ length: 80 }, (_, index) => (
                          <Text key={index}>Message {index + 1}</Text>
                        ))}
                      </View>
                    </ScreenScrollView>
                  </Screen>
                ),
              },
            ],
          }}
        />
      </View>
    );
  },
};
