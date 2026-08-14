import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Accordion> = {
  title: 'Navigation/Accordion',
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
  render: function SingleStory() {
    const [value, setValue] = useState<string | string[] | undefined>('account');
    return (
      <View style={{ width: 420 }}>
        <Accordion type="single" value={value} onValueChange={setValue}>
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
  render: function MultipleStory() {
    const [value, setValue] = useState<string | string[] | undefined>([
      'account',
      'sessions',
    ]);
    return (
      <View style={{ width: 420 }}>
        <Accordion type="multiple" value={value} onValueChange={setValue}>
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
  render: function DisabledStory() {
    const [value, setValue] = useState<string | string[] | undefined>(undefined);
    return (
      <View style={{ width: 420 }}>
        <Accordion type="single" value={value} onValueChange={setValue}>
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
  render: function LongStory() {
    const [value, setValue] = useState<string | string[] | undefined>('long');
    return (
      <View style={{ width: 420 }}>
        <Accordion type="single" value={value} onValueChange={setValue}>
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
