import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { CompactComposer } from './CompactComposer';
import { Button } from '../button';
import { StyledView as View } from '../styles/styled-primitives';
import { Text } from '../typography';
import { MediaAttachmentIcon } from '../icons/social/MediaAttachmentIcon';
import { GifAttachmentIcon } from '../icons/social/GifAttachmentIcon';

const meta = { title: 'Blocks/Compact Composer', component: CompactComposer } satisfies Meta<
  typeof CompactComposer
>;
export default meta;
type Story = StoryObj<typeof meta>;

function Example() {
  const [value, setValue] = useState('');
  const [attachment, setAttachment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const input = useRef<TextInputInstance>(null);
  return (
    <View className="gap-4 p-2" style={{ maxWidth: 600, width: '100%' }}>
      <View className="flex-row flex-wrap gap-2">
        <Button onPress={() => setValue('Line\n'.repeat(60))}>Load long draft</Button>
        <Button onPress={() => setValue('')}>Clear draft</Button>
        <Button onPress={() => setBusy((v) => !v)}>Toggle busy</Button>
        <Button onPress={() => input.current?.focus()}>Focus editor</Button>
      </View>
      <CompactComposer
        value={value}
        onChangeText={setValue}
        maxLength={250}
        inputRef={input}
        avatar={<View className="h-8 w-8 rounded-full bg-accent" />}
        attachments={
          attachment ? (
            <Button onPress={() => setAttachment(false)}>Remove attachment</Button>
          ) : null
        }
        attachmentActions={[
          {
            id: 'media',
            label: 'Attach media',
            icon: MediaAttachmentIcon,
            onPress: () => setAttachment(true),
          },
          {
            id: 'gif',
            label: 'Attach GIF',
            icon: GifAttachmentIcon,
            onPress: () => setAttachment(true),
          },
        ]}
        onFocusChange={setFocused}
        busy={busy}
        onExpand={() => input.current?.focus()}
        onSubmit={() => setSubmitted((n) => n + 1)}
        testID="compact-composer"
      />
      <Text testID="compact-status">
        {JSON.stringify({ focused, submitted, length: value.length })}
      </Text>
      <Button testID="outside">Outside editor</Button>
    </View>
  );
}
export const Editable: Story = {
  args: { value: '', onChangeText: () => {}, maxLength: 250, onSubmit: () => {} },
  render: () => <Example />,
};
