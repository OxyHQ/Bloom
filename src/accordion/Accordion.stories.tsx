import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Accordion> = {
  argTypes: {
    "type": { control: 'select', options: ["single","multiple"] }
  },
  title: 'Base/Accordion',
  component: Accordion,
};

export default meta;

type Story = StoryObj<typeof Accordion>;

const SECTIONS = [
  {
    value: 'account',
    title: 'Account',
    body: 'Your handle, display name and the addresses people can reach you on.',
  },
  {
    value: 'privacy',
    title: 'Privacy',
    body: 'Who can see your posts, who can mention you, and what leaves the device.',
  },
  {
    value: 'sessions',
    title: 'Sessions',
    body: 'Every device holding a live session, with the last time each one was used.',
  },
];

/**
 * `type="single"` — opening one section closes the other. The controlled value
 * is a single string, and `undefined` means everything is closed.
 */
export const Single: Story = {
  args: { type: "single" },
  parameters: { controls: { include: ["type"] } },
  render: function SingleStory(args) {
    const [value, setValue] = useState<string | string[] | undefined>('account');
    return (
      <View style={{ maxWidth: '100%', width: 420 }}>
        <Accordion {...args}  value={value} onValueChange={setValue}>
          {SECTIONS.map((s) => (
            <AccordionItem key={s.value} value={s.value}>
              <AccordionTrigger>{s.title}</AccordionTrigger>
              <AccordionContent>
                <Text>{s.body}</Text>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </View>
    );
  },
};

/**
 * `type="multiple"` — sections open independently and the value is an array.
 * Passing the wrong shape for the type is the mistake this component cannot
 * catch for you: the value must match `type`.
 */
export const Multiple: Story = {
  args: { type: "multiple" },
  parameters: { controls: { include: ["type"] } },
  render: function MultipleStory(args) {
    const [value, setValue] = useState<string | string[] | undefined>([
      'account',
      'sessions',
    ]);
    return (
      <View style={{ maxWidth: '100%', width: 420 }}>
        <Accordion {...args}  value={value} onValueChange={setValue}>
          {SECTIONS.map((s) => (
            <AccordionItem key={s.value} value={s.value}>
              <AccordionTrigger>{s.title}</AccordionTrigger>
              <AccordionContent>
                <Text>{s.body}</Text>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </View>
    );
  },
};

/** A disabled item keeps its place in the list and refuses to open. */
export const DisabledItem: Story = {
  args: { type: "single" },
  parameters: { controls: { include: ["type"] } },
  render: function DisabledStory(args) {
    const [value, setValue] = useState<string | string[] | undefined>(undefined);
    return (
      <View style={{ maxWidth: '100%', width: 420 }}>
        <Accordion {...args}  value={value} onValueChange={setValue}>
          <AccordionItem value="open">
            <AccordionTrigger>Available</AccordionTrigger>
            <AccordionContent>
              <Text>This one opens.</Text>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="locked" disabled>
            <AccordionTrigger>Locked</AccordionTrigger>
            <AccordionContent>
              <Text>Never reachable.</Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </View>
    );
  },
};

/**
 * Long content. The section used to clip at a hardcoded 500px, which silently
 * truncated anything taller — this story is tall enough to have shown it.
 */
export const LongContent: Story = {
  args: { type: "single" },
  parameters: { controls: { include: ["type"] } },
  render: function LongStory(args) {
    const [value, setValue] = useState<string | string[] | undefined>('long');
    return (
      <View style={{ maxWidth: '100%', width: 420 }}>
        <Accordion {...args}  value={value} onValueChange={setValue}>
          <AccordionItem value="long">
            <AccordionTrigger>Release notes</AccordionTrigger>
            <AccordionContent>
              <View style={{ gap: 12 }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <Text key={i}>
                    {i + 1}. A line of content, repeated far past the height a
                    fixed `maxHeight` would have allowed.
                  </Text>
                ))}
              </View>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </View>
    );
  },
};

export const AuthoredSurface: Story = {
  render: function AuthoredSurface() {
    const [value, setValue] = useState<string | string[] | undefined>();
    return <View style={{ padding: 24, gap: 16 }}>
      <button data-testid="collapse-external" onClick={() => setValue(undefined)}>Collapse externally</button>
      <Accordion value={value} onValueChange={setValue} className="bloom-demo-accordion" testID="authored-accordion"
        transition={{ duration: 250, easing: [.23, 1, .32, 1] }}>
        <AccordionItem value="details" className="bloom-demo-accordion-item">
          <AccordionTrigger className="bloom-demo-accordion-trigger">Details</AccordionTrigger>
          <AccordionContent className="bloom-demo-accordion-panel" contentClassName="bloom-demo-accordion-body">
            <input aria-label="Expanded input" defaultValue="Retained content" />
            <div style={{ height: 900 }}>Tall content remains measurable while collapsed.</div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="more"><AccordionTrigger>More</AccordionTrigger><AccordionContent>Another panel</AccordionContent></AccordionItem>
      </Accordion>
      <button data-testid="after-accordion">After accordion</button>
    </View>;
  },
};

export const StyleOverrides: Story = {
  render: () => <Accordion value="a" onValueChange={() => {}} style={[{ paddingHorizontal: 12 }, { width: 360 }]}>
    <AccordionItem value="a"><AccordionTrigger style={{ paddingVertical: 16, paddingHorizontal: 0 }} textStyle={{ fontSize: 18, lineHeight: 20 }}>Style overrides</AccordionTrigger>
      <AccordionContent><Text>Measured body</Text></AccordionContent>
    </AccordionItem>
  </Accordion>,
};
