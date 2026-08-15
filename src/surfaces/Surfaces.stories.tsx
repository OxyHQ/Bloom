import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { alert, confirm, prompt, present } from './index';
import { Button } from '../button';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/Surfaces',
};

export default meta;

type Story = StoryObj;

/**
 * The surface stack is Bloom's ONE imperative overlay API. `alert`, `confirm`
 * and `prompt` present onto it from anywhere — no ref, no local `open` state,
 * no second provider — and a single `<SurfaceHost>` renders whatever is on the
 * stack.
 *
 * The reason to reach for it over a `Dialog` you render yourself: these are
 * answers to a QUESTION, so the call site wants a value back, and a component
 * you have to mount cannot be awaited. `confirm()` resolves to a boolean and
 * `prompt()` to a string or null.
 *
 * Two calls in a row STACK rather than queue — the second paints over the
 * first, and dismissing it reveals the first. If you want them one after the
 * other, await the first.
 */
export const Alert: Story = {
  render: () => (
    <View style={{ gap: 12, width: 320 }}>
      <Button onPress={() => alert('Saved', 'Your changes are live.')}>
        One button
      </Button>
      <Button
        onPress={() =>
          alert('Delete draft?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive' },
          ])
        }
      >
        Custom buttons
      </Button>
    </View>
  ),
};

/** `confirm()` resolves to a boolean — the whole point of awaiting it. */
export const Confirm: Story = {
  render: function ConfirmStory() {
    const [answer, setAnswer] = useState<string>('—');
    return (
      <View style={{ gap: 12, width: 320 }}>
        <Button
          onPress={async () => {
            const ok = await confirm({
              title: 'Leave this page?',
              description: 'Your draft will be kept.',
              confirmLabel: 'Leave',
            });
            setAnswer(ok ? 'confirmed' : 'cancelled');
          }}
        >
          Ask
        </Button>
        <Button
          onPress={async () => {
            const ok = await confirm({
              title: 'Delete account',
              description: 'Everything is removed immediately.',
              confirmLabel: 'Delete',
              destructive: true,
            });
            setAnswer(ok ? 'confirmed' : 'cancelled');
          }}
        >
          Ask (destructive)
        </Button>
        <Text>Answer: {answer}</Text>
      </View>
    );
  },
};

/** `prompt()` resolves to the text, or `null` if the user backed out. */
export const Prompt: Story = {
  render: function PromptStory() {
    const [name, setName] = useState<string>('—');
    return (
      <View style={{ gap: 12, width: 320 }}>
        <Button
          onPress={async () => {
            const value = await prompt({
              title: 'Name this list',
              placeholder: 'Reading list',
            });
            setName(value ?? 'cancelled');
          }}
        >
          Ask for a name
        </Button>
        <Text>Name: {name}</Text>
      </View>
    );
  },
};

/**
 * `present()` is the general form the three helpers are built on: any content,
 * any placement, resolving whatever the content passes to `surface.dismiss()`.
 */
export const CustomSurface: Story = {
  render: function CustomSurfaceStory() {
    const [picked, setPicked] = useState('—');
    return (
      <View style={{ gap: 12, width: 320 }}>
        <Button
          onPress={async () => {
            const value = await present<string>(
              (surface) => (
                <View style={{ gap: 8, padding: 8 }}>
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <Button key={size} onPress={() => surface.dismiss(size)}>
                      {size}
                    </Button>
                  ))}
                </View>
              ),
              { placement: 'bottom', title: 'Pick a size', label: 'Pick a size' },
            );
            setPicked(value ?? 'dismissed');
          }}
        >
          Present a sheet
        </Button>
        <Text>Picked: {picked}</Text>
      </View>
    );
  },
};

/** Stacking: the second surface paints over the first, and dismissing reveals it. */
export const TwoAtOnce: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <Button
        onPress={() => {
          alert('First', 'Opened first.');
          alert('Second', 'Opened second — this one is on top.');
        }}
      >
        Open two
      </Button>
    </View>
  ),
};
