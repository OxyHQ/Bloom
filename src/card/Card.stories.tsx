import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardDescription,
} from './index';
import { Button } from '../button';
import type { CardRadius } from './types';

const meta: Meta<typeof Card> = {
  argTypes: {
    "appearance": { control: 'select', options: ["solid","subtle","outline","plain"] },
    "tone": { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    "radius": { control: 'select', options: ["radius-2","radius-4","radius-8","radius-12","radius-16","radius-20","radius-24","radius-28","radius-max"] },
    "elevation": { control: 'select', options: ["glass","none","s","m"] },
    "border": { control: 'select', options: ["none","hairline","thin"] },
    "disabled": { control: 'boolean' }
  },
  title: 'Base/Card',
  component: Card,
};

export default meta;

type Story = StoryObj<typeof Card>;

/**
 * The four presets side by side. `plain` is the bare `card` surface; each of the
 * others adds exactly one axis to it.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', gap: 24, width: 320 }}>
      {(['plain', 'solid', 'outline', 'subtle'] as const).map((variant) => (
        <Card key={variant} appearance={variant} testID={`card-${variant}`}>
          <CardHeader>
            <CardTitle>{variant}</CardTitle>
            <CardDescription>
              {variant === 'plain'
                ? 'The card background, nothing else.'
                : variant === 'solid'
                  ? 'Adds shadow-s.'
                  : variant === 'outline'
                    ? 'Adds a 1px border.'
                    : 'Swaps the background for backgroundSecondary.'}
            </CardDescription>
          </CardHeader>
          <CardBody>
            <CardDescription>
              Header, body and footer are the padding rhythm — they draw no chrome.
            </CardDescription>
          </CardBody>
          <CardFooter>
            <Button size="sm" onPress={() => {}} appearance="subtle" tone="accent">
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      ))}
    </View>
  ),
};

/**
 * Every rung of the `RADIUS` scale a card surface uses in this library, so the
 * difference between a settings group (16) and a link preview (20) is visible
 * rather than a number in two files.
 */
export const Rungs: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {(
        ['radius-4', 'radius-12', 'radius-16', 'radius-20', 'radius-28'] as CardRadius[]
      ).map((radius) => (
        <Card
          key={radius}
          appearance="outline"
          radius={radius}
          style={{ width: 140, height: 80, alignItems: 'center', justifyContent: 'center' }}
          testID={`card-${radius}`}
        >
          <CardTitle>{radius}</CardTitle>
        </Card>
      ))}
    </View>
  ),
};

/**
 * `border` and `elevation` refine the preset, so a bordered card that also
 * raises does not need a variant of its own — which is what the five hand-rolled
 * card surfaces in this library each invented separately.
 */
export const Axes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', gap: 24, width: 320 }}>
      <Card appearance="outline" border="hairline" elevation="s" radius="radius-20">
        <CardBody>
          <CardTitle>hairline + shadow-s</CardTitle>
          <CardDescription>A light raised surface.</CardDescription>
        </CardBody>
      </Card>
      <Card appearance="outline" border="hairline" elevation="m" radius="radius-16">
        <CardBody>
          <CardTitle>hairline + shadow-m</CardTitle>
          <CardDescription>What `UserHoverCard` is.</CardDescription>
        </CardBody>
      </Card>
      <Card appearance="plain" radius="radius-16">
        <CardBody>
          <CardTitle>no border, no shadow</CardTitle>
          <CardDescription>What a `SettingsListGroup` is.</CardDescription>
        </CardBody>
      </Card>
    </View>
  ),
};

/**
 * A card with `onPress` becomes a pressable. `accessibilityRole` is the one
 * decision the caller has to make: a card that opens a URL is a `link`.
 */
export const Pressable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', gap: 16, width: 320 }}>
      <Card onPress={() => {}} testID="card-pressable">
        <CardBody>
          <CardTitle>Pressable card</CardTitle>
          <CardDescription>role=button, dims to 0.85 while held</CardDescription>
        </CardBody>
      </Card>
      <Card onPress={() => {}} disabled testID="card-disabled">
        <CardBody>
          <CardTitle>Disabled</CardTitle>
          <CardDescription>0.5 opacity, no press feedback</CardDescription>
        </CardBody>
      </Card>
    </View>
  ),
};

/**
 * The A/B subject for the composition work: the default card, at the rung and
 * elevation every other card surface is measured against.
 */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card testID="card-default" style={{ width: 280, height: 96 }}>
      <CardBody>
        <CardTitle>Default</CardTitle>
        <CardDescription>elevated, radius-12</CardDescription>
      </CardBody>
    </Card>
  ),
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { appearance: 'solid', tone: 'neutral', radius: 'radius-12' },
  render: (args) => <View style={{ width: 340, maxWidth: '100%' }}><Card {...args}><CardHeader><CardTitle>Project overview</CardTitle><CardDescription>Change the surface using Controls.</CardDescription></CardHeader><CardBody><CardDescription>Header, content and footer share one card.</CardDescription></CardBody></Card></View>,
};
