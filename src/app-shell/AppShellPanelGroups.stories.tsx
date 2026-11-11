import { useState, type ReactNode } from 'react';
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
  exitCount = 0,
  resizeCommits = 0,
  short = false,
}: {
  title: string;
  onOpen?: () => void;
  onDeck?: () => void;
  exitCount?: number;
  resizeCommits?: number;
  short?: boolean;
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
                <Button
                  testID="groups-open"
                  accessibilityLabel={`Likes; completed exits ${exitCount}; resize commits ${resizeCommits}`}
                  onPress={onOpen}
                >
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
          {Array.from({ length: short ? 2 : 35 }, (_, index) => (
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
  short = false,
  transition = 'exit-before-enter',
  contentCap = false,
}: {
  documentFlow?: boolean;
  mixed?: boolean;
  capped?: boolean;
  deckSwitch?: boolean;
  short?: boolean;
  transition?: 'simultaneous' | 'exit-before-enter';
  contentCap?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [resizeCommits, setResizeCommits] = useState(0);
  const [deck, setDeck] = useState(false);
  return (
    <AppShell
      testID="groups-shell"
      variant={deckSwitch ? 'feed' : undefined}
      contentMaxWidth={deckSwitch ? undefined : 'none'}
      header={null}
      gutter={8}
      scroll={documentFlow ? 'document' : 'fixed'}
      panelLayout={{
        mode: deck ? 'deck' : 'split',
        flow: documentFlow && !deck ? 'document' : 'bounded',
        transition,
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
              onSpansChange: () => setResizeCommits((count) => count + 1),
              panels: [
                {
                  id: 'main',
                  minHeight: 120,
                  testID: 'groups-main',
                  resizable: true,
                  content: (
                    <ReadingPanel
                      title="Post"
                      exitCount={exitCount}
                      resizeCommits={resizeCommits}
                      short={short}
                      onOpen={() => setOpen(true)}
                      onDeck={deckSwitch ? () => setDeck(!deck) : undefined}
                    />
                  ),
                },
                {
                  id: 'likes',
                  minHeight: 120,
                  resizeMaxHeight: contentCap ? 'content' : undefined,
                  testID: 'groups-likes',
                  visible: open,
                  onExitComplete: () => setExitCount((count) => count + 1),
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
                  content: <ReadingPanel title="Likes" short={short} />,
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
                  content: <ReadingPanel title="Context" short />,
                },
                {
                  id: 'column',
                  visible: deck,
                  width: 390,
                  group: {
                    panels: [{ id: 'column-content', content: <ReadingPanel title="Column" /> }],
                  },
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
// Model the consumer's definite percent-height root, including classic scrollbars.
function PercentHeightHost({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html:has([data-testid="groups-percent-host"]),
        body:has([data-testid="groups-percent-host"]),
        #storybook-root:has([data-testid="groups-percent-host"]),
        #storybook-root div:has([data-testid="groups-percent-host"]) {
          height: 100%;
          min-height: 0 !important;
        }
      `}</style>
      <View testID="groups-percent-host" className="h-full">
        {children}
      </View>
    </>
  );
}

export const DeckSwitch: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => (
    <PercentHeightHost>
      <SplitExample documentFlow deckSwitch />
    </PercentHeightHost>
  ),
};
export const SimultaneousDeckSwitch: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => (
    <PercentHeightHost>
      <SplitExample documentFlow deckSwitch transition="simultaneous" />
    </PercentHeightHost>
  ),
};
export const ShortDeckSwitch: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => (
    <PercentHeightHost>
      <SplitExample documentFlow deckSwitch short />
    </PercentHeightHost>
  ),
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

export const ContentCappedSplit: Story = {
  render: () => <SplitExample short contentCap />,
};

function ReorderGroupsExample() {
  const [order, setOrder] = useState<readonly string[]>(['main', 'first', 'second']);
  return (
    <AppShell
      header={null}
      scroll="fixed"
      contentMaxWidth="none"
      panelLayout={{
        mode: 'deck',
        flow: 'bounded',
        horizontalScroll: 'contained',
        onPanelOrderChange: setOrder,
        panels: order.map((id) => ({
          id,
          testID: `reorder-${id}`,
          width: 300,
          reorderable: id !== 'main',
          reorderLabel: id,
          group: {
            axis: 'vertical',
            mode: 'split',
            panels: [
              { id, content: <ReadingPanel title={id} short /> },
              { id: 'detail', content: <ReadingPanel title={`${id} detail`} short /> },
            ],
          },
        })),
      }}
    />
  );
}

export const ReorderNestedGroups: Story = { render: () => <ReorderGroupsExample /> };
