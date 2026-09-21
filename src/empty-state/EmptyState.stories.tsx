import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody } from '../card';
import { Chip, ChipRow } from '../chip';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiShoppingBag3Line } from '../icons/remix/RiShoppingBag3Line';
import { Text } from '../typography';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Base/Empty State',
  component: EmptyState,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 24, gap: 24, maxWidth: 720, width: '100%' }}>{children}</View>;
}

/** The screen rung: a glyph, a heading, a line, and the thing to do about it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <EmptyState
        icon={RiInbox2Line}
        title="Nothing in this folder"
        description="Mail you file here will show up in this list."
        action={{ label: 'Write a message', onPress: () => {} }}
      />
    </Page>
  ),
};

/** `media="circle"` is the louder mark: the whole screen, or an invitation. */
export const Inviting: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <EmptyState
        icon={RiMapPin2Line}
        media="circle"
        title="No saved places yet"
        description="Save the places you order to most and they will be one tap away."
        action={{ label: 'Add an address', onPress: () => {} }}
        secondaryAction={{ label: 'Use my location', onPress: () => {} }}
      />
    </Page>
  ),
};

/** The panel rung: the same three lines, at a size a side panel can hold. */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Card radius="radius-16" style={{ maxWidth: 320 }}>
        <CardBody>
          <EmptyState
            variant="compact"
            icon={RiShoppingBag3Line}
            title="Your basket is empty"
            description="Add something from the menu."
            action={{ label: 'Browse the menu', onPress: () => {} }}
          />
        </CardBody>
      </Card>
    </Page>
  ),
};

/** No mark at all, and a floor: the shape a table body holds a band open with. */
export const TextOnlyBand: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Card radius="radius-16">
        <EmptyState variant="compact" minHeight={160} description="No streams in this period yet." />
      </Card>
    </Page>
  ),
};

/** `children` sits between the explanation and the actions; `footer` under them. */
export const WithSuggestions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <EmptyState
        icon={RiSearchLine}
        title="No results for “sourdough”"
        description="Try one of these instead."
        action={{ label: 'Clear the search', onPress: () => {} }}
        footer={<Text variant="caption-1-regular">Searches cover names and ingredients.</Text>}
      >
        <ChipRow accessibilityLabel="Suggestions" contentInset={0}>
          <Chip size="large" onPress={() => {}}>
            Rye
          </Chip>
          <Chip size="large" onPress={() => {}}>
            Focaccia
          </Chip>
          <Chip size="large" onPress={() => {}}>
            Flatbread
          </Chip>
        </ChipRow>
      </EmptyState>
    </Page>
  ),
};

/** A long title and a long line, at the narrowest viewport this library targets. */
export const LongText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 358, padding: 16 }}>
      <EmptyState
        icon={RiInbox2Line}
        title="There is nothing left in this archived folder to show you"
        description="Everything that was filed here has been moved to another folder, deleted, or is still being synchronised from the server."
        action={{ label: 'Go to the inbox', onPress: () => {} }}
        secondaryAction={{ label: 'Refresh', onPress: () => {} }}
      />
    </View>
  ),
};

/** Edit the props in Controls. */
export const Playground: Story = {
  args: {
    icon: RiInbox2Line,
    title: 'Nothing here yet',
    description: 'This is where the things you keep will appear.',
    variant: 'comfortable',
    media: 'glyph',
  },
};
