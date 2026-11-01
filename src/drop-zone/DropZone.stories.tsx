import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DropZone } from './index';
import type { DropData } from './index';
import { Text } from '../typography';

const meta: Meta = {
  component: DropZone,
  id: 'base-drop-zone',
  title: 'Components/Inputs/DropZone',
};

export default meta;

type Story = StoryObj;

/**
 * Drop files or links from another tab, the desktop or another application on
 * the zone. While a drag it takes is over it, it shows the action a drop would
 * take (Option or Alt forces a copy, Command or Meta a move); at the drop it
 * lists what arrived. The content is read only at the drop, as the browser's
 * protected mode keeps it.
 */
export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: function BasicStory() {
    const [over, setOver] = useState<string | null>(null);
    const [dropped, setDropped] = useState<DropData | null>(null);
    return (
      <DropZone
        accept={['files', 'url', 'text']}
        actions={['copy', 'move']}
        onDragEnter={({ action }) => setOver(action ?? 'none')}
        onDragOver={({ action }) => setOver(action ?? 'none')}
        onDragLeave={() => setOver(null)}
        onDrop={({ data }) => setDropped(data)}
      >
        <View
          style={{
            width: 360,
            maxWidth: '100%',
            minHeight: 160,
            borderRadius: 16,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: over ? '#2f9e44' : '#adb5bd',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            gap: 6,
          }}
        >
          <Text>{over ? `Drop to ${over}` : 'Drop files, links or text here'}</Text>
          {dropped?.files.map((file) => (
            <Text key={file.uri ?? file.name}>{file.name}</Text>
          ))}
          {dropped?.urls.map((url) => (
            <Text key={url}>{url}</Text>
          ))}
          {dropped?.text ? <Text>{dropped.text}</Text> : null}
        </View>
      </DropZone>
    );
  },
};
