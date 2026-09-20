import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Field } from '../field';
import { TextFieldInput } from '../text-field';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { TagField } from './TagField';
import type { TagSuggestion } from './types';

const meta: Meta = {
  title: 'Blocks/Notes/Tag Field',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;
type Story = StoryObj;

const VOCABULARY: TagSuggestion[] = [
  { value: 'field notes', meta: '42' },
  { value: 'tide', meta: '18' },
  { value: 'autumn', meta: '11' },
  { value: 'house', meta: '9' },
  { value: 'kitchen rebuild', meta: '6' },
  { value: 'reading', meta: '31' },
  { value: 'winter', meta: '7' },
  { value: 'recipes', meta: '24' },
  { value: 'q3 planning', meta: '3' },
  { value: 'planning — legacy', meta: '1' },
];

function Page({ children, width = 480 }: { children: React.ReactNode; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 420 }}>
      <View style={{ maxWidth: width, gap: 20 }}>{children}</View>
    </View>
  );
}

/** Type, comma or Enter to add; backspace on an empty caret removes the last. */
export const Basic: Story = {
  render: function BasicStory() {
    const [tags, setTags] = useState<string[]>(['field notes', 'tide']);
    return (
      <Page>
        <TagField
          value={tags}
          onChange={(next) => setTags([...next])}
          suggestions={VOCABULARY}
          placeholder="Add a tag"
          label="Tags"
          testID="tags"
        />
        <Text variant="caption-1-regular">{tags.join(' · ') || 'no tags'}</Text>
      </Page>
    );
  },
};

/**
 * Inside a `Field`: the label names the input, the description describes it, and
 * the error and disabled state reach it — none of it written on the control.
 */
export const InAField: Story = {
  render: function InAFieldStory() {
    const [tags, setTags] = useState<string[]>(['reading']);
    const [invalid, setInvalid] = useState(true);
    return (
      <Page>
        <Field
          label="Tags"
          description="Anything you will want to search for later."
          error={invalid ? 'Pick at least two.' : undefined}
          required
        >
          <TagField value={tags} onChange={(next) => setTags([...next])} suggestions={VOCABULARY} testID="in-field" />
        </Field>
        <Button variant="secondary" size="small" onPress={() => setInvalid((v) => !v)}>
          Toggle the error
        </Button>
        <Field label="Disabled by the field" disabled>
          <TagField value={['locked', 'by the field']} onChange={() => {}} />
        </Field>
        <Field label="A form row above it" description="So the shells can be compared.">
          <TextFieldInput label="Notebook" defaultValue="Field notes" />
        </Field>
      </Page>
    );
  },
};

/** A ceiling, a closed vocabulary, and the two of them together. */
export const LimitsAndVocabulary: Story = {
  render: function LimitsStory() {
    const [capped, setCapped] = useState<string[]>(['tide', 'autumn']);
    const [closed, setClosed] = useState<string[]>([]);
    const [refused, setRefused] = useState(0);
    return (
      <Page>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-medium">Three maximum</Text>
          <TagField
            value={capped}
            onChange={(next) => setCapped([...next])}
            suggestions={VOCABULARY}
            max={3}
            onMaxReached={() => setRefused((n) => n + 1)}
            label="Tags"
            placeholder="Add a tag"
            testID="capped"
          />
          <Text variant="caption-1-regular">{`refused ${refused} time(s)`}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-medium">Closed vocabulary — nothing new can be typed in</Text>
          <TagField
            value={closed}
            onChange={(next) => setClosed([...next])}
            suggestions={VOCABULARY}
            allowCreate={false}
            label="Tags"
            placeholder="Pick a tag"
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-medium">Small, toned, disabled</Text>
          <TagField value={['recipes', 'winter']} onChange={() => {}} size="small" tone="primary" />
          <TagField value={['recipes', 'winter']} onChange={() => {}} disabled />
          <TagField value={[]} onChange={() => {}} invalid placeholder="Invalid and empty" label="Tags" />
        </View>
      </Page>
    );
  },
};

/** It is not a notes control: the same field, three domains. */
export const NotAboutNotes: Story = {
  render: function GenericStory() {
    const [skills, setSkills] = useState<string[]>(['TypeScript', 'Design systems']);
    const [labels, setLabels] = useState<string[]>(['blocked']);
    const [recipients, setRecipients] = useState<string[]>(['Tamsin Ruiz']);
    return (
      <Page width={520}>
        <Field label="Skills" description="A CRM's candidate record.">
          <TagField
            value={skills}
            onChange={(next) => setSkills([...next])}
            suggestions={['TypeScript', 'Design systems', 'Accessibility', 'Rust', 'Data modelling']}
            tone="info"
          />
        </Field>
        <Field label="Labels" description="A task app's issue.">
          <TagField
            value={labels}
            onChange={(next) => setLabels([...next])}
            suggestions={['blocked', 'needs design', 'regression', 'good first issue']}
            tone="warning"
          />
        </Field>
        <Field label="Share with" description="A document's access list.">
          <TagField
            value={recipients}
            onChange={(next) => setRecipients([...next])}
            suggestions={['Tamsin Ruiz', 'Priya Okafor', 'Bo Lindqvist', 'Marek Dvořák']}
            allowCreate={false}
            tone="success"
          />
        </Field>
      </Page>
    );
  },
};

/** 360px: many chips, wrapping, and the list under a full-width field. */
export const Phone: Story = {
  render: function PhoneStory() {
    const [tags, setTags] = useState<string[]>([
      'field notes',
      'tide',
      'autumn',
      'kitchen rebuild',
      'planning — legacy',
    ]);
    return (
      <Page width={360}>
        <Field label="Tags" description="Comma or Enter adds one.">
          <TagField
            value={tags}
            onChange={(next) => setTags([...next])}
            suggestions={VOCABULARY}
            placeholder="Add a tag"
            testID="tags"
          />
        </Field>
      </Page>
    );
  },
};
