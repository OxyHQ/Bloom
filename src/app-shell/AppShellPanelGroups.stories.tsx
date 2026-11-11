import { useState } from 'react';
import { StyledView as View } from '../styles/styled-primitives';
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

function ReadingPanel({
  title,
  onOpen,
  onDeck,
}: {
  title: string;
  onOpen?: () => void;
  onDeck?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <Screen
      testID={`groups-${title.toLowerCase()}-screen`}
      header={
        <PageHeader
          title={title}
          actions={
            onOpen ? (
              <View className="flex-row gap-2">
                <Button testID="groups-open" onPress={onOpen}>
                  Likes
                </Button>
                {onDeck ? (
                  <Button testID="groups-deck" onPress={onDeck}>
                    Deck
                  </Button>
                ) : null}
              </View>
            ) : undefined
          }
        />
      }
    >
      <ScreenScrollView>
        <View className="gap-4 p-4">
          <Button testID={`groups-${title.toLowerCase()}-saved`} onPress={() => setSaved(!saved)}>
            {saved ? 'Saved' : 'Save'}
          </Button>
          {Array.from({ length: 35 }, (_, index) => (
            <Text key={index} className="py-4">
              {title} paragraph {index + 1}. Each panel keeps its own reading position.
            </Text>
          ))}
        </View>
      </ScreenScrollView>
    </Screen>
  );
}

function SplitExample({
  documentFlow = false,
  mixed = false,
  capped = false,
  deckSwitch = false,
}: {
  documentFlow?: boolean;
  mixed?: boolean;
  capped?: boolean;
  deckSwitch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deck, setDeck] = useState(false);
  return (
    <AppShell
      testID="groups-shell"
      contentMaxWidth="none"
      header={null}
      gutter={8}
      scroll={documentFlow ? 'document' : 'fixed'}
      panelLayout={{
        mode: deck ? 'deck' : 'split',
        flow: documentFlow && !deck ? 'document' : 'bounded',
        transition: 'exit-before-enter',
        panels: [
          {
            id: 'workspace',
            ...(capped ? { width: 360, minWidth: 360, maxWidth: 360 } : {}),
            ...(deckSwitch ? { width: deck ? 390 : 620, maxWidth: deck ? 390 : undefined } : {}),
            testID: 'groups-workspace',
            group: {
              mode: 'split',
              axis: 'vertical',
              singlePanelFlow: documentFlow ? 'document' : undefined,
              gap: 8,
              resizeHandle: 'pill',
              panels: [
                {
                  id: 'main',
                  minHeight: 120,
                  testID: 'groups-main',
                  resizable: true,
                  content: (
                    <ReadingPanel
                      title="Post"
                      onOpen={() => setOpen(true)}
                      onDeck={deckSwitch ? () => setDeck(!deck) : undefined}
                    />
                  ),
                },
                {
                  id: 'likes',
                  minHeight: 120,
                  testID: 'groups-likes',
                  visible: open,
                  floating: {
                    below: 'md',
                    whenConstrained: true,
                    open,
                    onOpenChange: setOpen,
                    placement: 'bottom',
                    label: 'Likes',
                  },
                  headerActions: (
                    <Button testID="groups-close" onPress={() => setOpen(false)}>
                      Close likes
                    </Button>
                  ),
                  content: <ReadingPanel title="Likes" />,
                },
              ],
            },
          },
          ...(mixed || capped
            ? [{ id: 'aside', testID: 'groups-aside', content: <ReadingPanel title="Aside" /> }]
            : []),
          ...(deckSwitch
            ? [
                {
                  id: 'context',
                  visible: !deck,
                  width: 350,
                  content: <ReadingPanel title="Context" />,
                },
                {
                  id: 'column',
                  visible: deck,
                  width: 390,
                  content: <ReadingPanel title="Column" />,
                },
              ]
            : []),
        ],
      }}
    />
  );
}

export const NestedSplit: Story = { render: () => <SplitExample /> };
export const CappedResponsive: Story = { render: () => <SplitExample capped /> };
export const MixedAxes: Story = { render: () => <SplitExample mixed /> };
export const DocumentSplit: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => <SplitExample documentFlow />,
};
export const DeckSwitch: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => <SplitExample documentFlow deckSwitch />,
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
          header: (
            <PageHeader
              title="Emails"
              actions={
                <Button testID="flow-add" onPress={() => setCount(count + 1)}>
                  Add email
                </Button>
              }
            />
          ),
          panels: Array.from({ length: count }, (_, index) => ({
            id: `email-${index}`,
            testID: `flow-email-${index}`,
            content: (
              <View className="gap-4 p-6">
                <Text>Email {index + 1}</Text>
                {Array.from({ length: index % 2 === 0 ? 5 : 8 }, (_, paragraph) => (
                  <Text key={paragraph}>
                    Message paragraph {paragraph + 1}. Messages add to the common scroll area.
                  </Text>
                ))}
              </View>
            ),
          })),
        }}
      />
    );
  },
};

export const HorizontalFlow: Story = {
  render: function HorizontalFlow() {
    const [count, setCount] = useState(4);
    return (
      <AppShell
        testID="horizontal-shell"
        contentMaxWidth="none"
        header={null}
        gutter={8}
        scroll="fixed"
        panelLayout={{
          mode: 'flow',
          axis: 'horizontal',
          horizontalScroll: 'contained',
          header: (
            <PageHeader
              title="Columns"
              actions={
                <Button testID="horizontal-add" onPress={() => setCount(count + 1)}>
                  Add column
                </Button>
              }
            />
          ),
          panels: Array.from({ length: count }, (_, index) => ({
            id: `column-${index}`,
            testID: `horizontal-column-${index}`,
            width: 360,
            content: <ReadingPanel title={`Column ${index + 1}`} />,
          })),
        }}
      />
    );
  },
};
