import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '../textarea';
import { Divider } from '../divider';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiBold } from '../icons/remix/RiBold';
import { RiCodeSLine } from '../icons/remix/RiCodeSLine';
import { RiDoubleQuotesL } from '../icons/remix/RiDoubleQuotesL';
import { RiFontSize } from '../icons/remix/RiFontSize';
import { RiImageLine } from '../icons/remix/RiImageLine';
import { RiItalic } from '../icons/remix/RiItalic';
import { RiLinkM } from '../icons/remix/RiLinkM';
import { RiListCheck3 } from '../icons/remix/RiListCheck3';
import { RiListUnordered } from '../icons/remix/RiListUnordered';
import { NoteEditorHeader } from './NoteEditorHeader';
import { NoteEditorToolbar } from './NoteEditorToolbar';
import type { NoteEditorAction, NoteSaveState } from './types';

const meta: Meta = {
  title: 'Blocks/Notes/Note Editor',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;
type Story = StoryObj;

const BODY =
  'Slack water is at 06:40. Forty minutes, maybe fifty if the wind stays off the point.\n\nThe long lens is still in the car from Tuesday. Stool, flask, the spare battery that actually holds a charge.\n\nLast time we stood there for two hours and came back with one blurred heron, so: arrive early, set up before the light, and do not talk to the man with the dog.';

function Page({ children, width = 720 }: { children: React.ReactNode; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 420 }}>
      <View style={{ maxWidth: width, gap: 12 }}>{children}</View>
    </View>
  );
}

function useActions(): NoteEditorAction[] {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [list, setList] = useState(false);
  const [check, setCheck] = useState(false);
  return [
    { key: 'bold', label: 'Bold', icon: RiBold, active: bold, onPress: () => setBold((v) => !v), alwaysVisible: true },
    { key: 'italic', label: 'Italic', icon: RiItalic, active: italic, onPress: () => setItalic((v) => !v), alwaysVisible: true },
    { key: 'heading', label: 'Heading', icon: RiFontSize, onPress: () => {} },
    { key: 'list', label: 'Bulleted list', icon: RiListUnordered, active: list, onPress: () => setList((v) => !v) },
    { key: 'checklist', label: 'Checklist', icon: RiListCheck3, active: check, onPress: () => setCheck((v) => !v) },
    { key: 'quote', label: 'Quote', icon: RiDoubleQuotesL, onPress: () => {} },
    { key: 'code', label: 'Code', icon: RiCodeSLine, onPress: () => {} },
    { key: 'link', label: 'Link', icon: RiLinkM, onPress: () => {} },
    { key: 'image', label: 'Image', icon: RiImageLine, onPress: () => {} },
    { key: 'attach', label: 'Attach a file', icon: RiAttachment2, onPress: () => {} },
  ];
}

/** The whole chrome around someone else's writing surface. */
export const Editor: Story = {
  render: function EditorStory() {
    const [title, setTitle] = useState('Harbour walk — what to bring');
    const [body, setBody] = useState(BODY);
    const actions = useActions();
    return (
      <Page>
        <NoteEditorHeader
          title={title}
          onTitleChange={setTitle}
          saveState="saved"
          edited="Edited 2 min ago"
          wordCount={body.trim().split(/\s+/).filter(Boolean).length}
          testID="header"
        />
        <NoteEditorToolbar actions={actions} accessibilityLabel="Formatting" testID="toolbar" />
        <Divider />
        <Textarea
          label="Note body"
          value={body}
          onChangeText={setBody}
          rows={10}
          resize="vertical"
        />
        <Text variant="caption-1-regular">
          The editable surface is the app's — Bloom supplies everything around it.
        </Text>
      </Page>
    );
  },
};

/** Every state the quiet line can be in. */
export const SaveStates: Story = {
  render: () => (
    <Page width={520}>
      {(['saved', 'saving', 'offline', 'error'] as NoteSaveState[]).map((state) => (
        <NoteEditorHeader
          key={state}
          title={`State: ${state}`}
          saveState={state}
          edited="Edited 14 Mar"
          wordCount={482}
          readOnly
        />
      ))}
      <NoteEditorHeader title="No store behind it" edited="Edited just now" />
      <NoteEditorHeader title="" placeholder="Untitled" wordCount={0} />
      <NoteEditorHeader title="Disabled while it syncs" saveState="saving" disabled />
    </Page>
  ),
};

/** The same ten actions at four widths — the row collapses from the right. */
export const ToolbarWidths: Story = {
  render: function ToolbarWidthsStory() {
    const actions = useActions();
    return (
      <Page width={860}>
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-regular">the whole column</Text>
          <NoteEditorToolbar actions={actions} accessibilityLabel="Formatting, full width" testID="toolbar-full" />
        </View>
        {[340, 280, 200, 120].map((width) => (
          <View key={width} style={{ gap: 6 }}>
            <Text variant="caption-1-regular">{`${width}px`}</Text>
            <View style={{ width }}>
              <NoteEditorToolbar
                actions={actions}
                accessibilityLabel={`Formatting at ${width}`}
                testID={`toolbar-${width}`}
              />
            </View>
          </View>
        ))}
        <View style={{ gap: 6 }}>
          <Text variant="caption-1-regular">small, disabled</Text>
          <View style={{ width: 360 }}>
            <NoteEditorToolbar actions={actions} size="small" disabled accessibilityLabel="Formatting, disabled" />
          </View>
        </View>
      </Page>
    );
  },
};

/** 360px: the header wraps its readings, the toolbar collapses. */
export const Phone: Story = {
  render: function PhoneStory() {
    const [title, setTitle] = useState('A note title long enough to need the second line of the input');
    const actions = useActions();
    return (
      <Page width={360}>
        <NoteEditorHeader
          title={title}
          onTitleChange={setTitle}
          saveState="offline"
          edited="Edited 2 min ago"
          wordCount={1284}
        />
        <NoteEditorToolbar actions={actions} accessibilityLabel="Formatting" />
        <Divider />
        <Textarea label="Note body" defaultValue={BODY} rows={8} />
      </Page>
    );
  },
};
