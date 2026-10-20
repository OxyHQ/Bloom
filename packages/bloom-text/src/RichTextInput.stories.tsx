import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { EnrichedTextInput } from 'react-native-enriched-html';
import { RichTextInput } from './RichTextInput';
import type { Segment } from './types';

function Raw() {
  return (
    <View style={{ padding: 24 }}>
      <EnrichedTextInput defaultValue="<html><p>Hello <b>raw</b></p></html>" />
    </View>
  );
}

function Wrapped() {
  const [value, setValue] = useState<Segment[]>([
    { text: 'Hello ' },
    { text: 'wrapped', bold: true },
  ]);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <RichTextInput value={value} onChange={(c) => setValue(c.segments)} />
      <Text testID="value">{JSON.stringify(value)}</Text>
    </View>
  );
}

const meta: Meta = { id: 'editor-richtextinput', title: 'Components/Inputs/Rich Text Input' };
export default meta;
export const RawInput: StoryObj = { render: () => <Raw /> };
export const Controlled: StoryObj = { render: () => <Wrapped /> };
