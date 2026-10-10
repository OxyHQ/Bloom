import React, { memo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomScope } from './BloomScope';
import type { BloomSize } from './types';
import { Surface } from '../surface';
import { Card } from '../card';
import { Button } from '../button';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Text } from '../typography';
import { LinkPreviewCard } from '../link-preview';
import { Field } from '../field';
import { TextFieldInput } from '../text-field';
import { Switch } from '../switch';
import { Dialog, useDialogControl } from '../dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu';

const meta: Meta = {
  title: 'System/Composition',
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
};
export default meta;
type Story = StoryObj;

function Composer({ disabled = false }: { disabled?: boolean }) {
  const [message, setMessage] = useState('');
  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Message"
        description="The same composer works inside a card or a dialog."
        disabled={disabled}
      >
        <TextFieldInput
          label="Message"
          value={message}
          onValueChange={setMessage}
          testID="composition-message"
        />
      </Field>
      <Field label="Notify followers" disabled={disabled}>
        <Switch defaultChecked testID="composition-notify" />
      </Field>
      <Button disabled={disabled || !message.trim()} testID="composition-send">
        Publish
      </Button>
    </View>
  );
}

function ConnectedScene() {
  const [size, setSize] = useState<BloomSize>('sm');
  const [disabled, setDisabled] = useState(false);
  const [range, setRange] = useState('Week');
  const editor = useDialogControl();
  return (
    <View style={{ padding: 24, gap: 20, maxWidth: 760, width: '100%' }}>
      <Text variant="title-2-semibold">Connected components</Text>
      <Text>Change the inherited size, open the menu, then move the composer into a dialog.</Text>
      <ButtonGroup accessibilityLabel="Control size" testID="composition-size">
        {(['xs', 'sm', 'md', 'lg'] as const).map((value) => (
          <ButtonGroupItem key={value} checked={size === value} onPress={() => setSize(value)}>
            {value}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <BloomScope size={size} tone="neutral">
        <Surface testID="composition-surface" style={{ padding: 20, gap: 18 }}>
          <Text variant="headline-semibold">Post</Text>
          <Card testID="composition-card" style={{ padding: 16, gap: 16 }}>
            <Text>A shared material, with a distinct nested backing.</Text>
            <LinkPreviewCard
              url="https://example.com/article"
              title="A link inside the post"
              description="Card and link preview resolve against their parent."
              onPress={() => editor.open()}
            />
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <Button testID="composition-inherited">Inherited size</Button>
              <Button size="md" testID="composition-explicit">
                Explicit md
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild label="Post actions">
                  <Button testID="composition-menu">Post actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent testID="composition-menu-content">
                  <DropdownMenuItem onPress={() => editor.open()} testID="composition-edit">
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Unavailable action</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </View>
            <ButtonGroup accessibilityLabel="Post range" testID="composition-range">
              {['Day', 'Week', 'Month'].map((value) => (
                <ButtonGroupItem
                  key={value}
                  checked={range === value}
                  onPress={() => setRange(value)}
                >
                  {value}
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
            <Switch
              checked={disabled}
              onCheckedChange={setDisabled}
              accessibilityLabel="Disable composer"
              testID="composition-disable"
            />
            <Composer disabled={disabled} />
          </Card>
        </Surface>
        <Dialog control={editor} title="Edit post">
          <View style={{ gap: 16 }}>
            <Composer disabled={disabled} />
            <Button onPress={() => editor.close()} testID="composition-close">
              Done
            </Button>
          </View>
        </Dialog>
      </BloomScope>
    </View>
  );
}

export const Connected: Story = { render: () => <ConnectedScene /> };

const DensePost = memo(function DensePost({ index }: { index: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <Card testID={`dense-post-${index}`} style={{ padding: 16, gap: 12 }}>
      <Text variant="headline-semibold">Post {index + 1}</Text>
      <Text>Nested surfaces and controls share the same material and visual environment.</Text>
      <LinkPreviewCard
        url={`https://example.com/article/${index}`}
        title={`Article ${index + 1}`}
        description="A nested card with its own surface level."
        onPress={() => {}}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button
          pressed={liked}
          onPress={() => setLiked((value) => !value)}
          testID={`dense-like-${index}`}
        >
          {liked ? 'Liked' : 'Like'}
        </Button>
        <Button appearance="plain">Reply</Button>
      </View>
    </Card>
  );
});

export const DenseFeed: Story = {
  render: () => (
    <BloomScope size="sm" tone="neutral">
      <View testID="dense-feed" style={{ padding: 24, gap: 16, maxWidth: 680, width: '100%' }}>
        <Text variant="title-2-semibold">100 posts</Text>
        {Array.from({ length: 100 }, (_, index) => (
          <DensePost key={index} index={index} />
        ))}
      </View>
    </BloomScope>
  ),
};
