import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './index';
import {
  RiAddLine as Plus,
  RiArrowLeftLine as ArrowLeft,
  RiArrowRightLine as ArrowRight,
} from '../icons/remix';

const meta: Meta<typeof Button.Group> = {
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    dividers: { control: 'boolean' },
  },
  id: 'base-button-group',
  title: 'Components/Actions/Button/Grouped',
  component: Button.Group,
};

export default meta;

type Story = StoryObj<typeof Button.Group>;

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Button.Group accessibilityLabel="Alignment">
      <Button>Left</Button>
      <Button>Center</Button>
      <Button>Right</Button>
    </Button.Group>
  ),
};

function SelectableGroup({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' }) {
  const [selected, setSelected] = useState('week');
  return (
    <Button.Group size={size} accessibilityLabel="Range">
      {['day', 'week', 'month'].map((value) => (
        <Button key={value} pressed={selected === value} onPress={() => setSelected(value)}>
          {value[0]?.toUpperCase() + value.slice(1)}
        </Button>
      ))}
    </Button.Group>
  );
}

/** Every shape, at both sizes. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 20, alignItems: 'flex-start' }}>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <View key={size} style={{ gap: 12, alignItems: 'flex-start' }}>
          <Button.Group size={size} accessibilityLabel="Alignment">
            <Button>Left</Button>
            <Button>Center</Button>
            <Button>Right</Button>
          </Button.Group>
          <Button.Group size={size} accessibilityLabel="Actions">
            <Button leadingIcon={Plus}>Add</Button>
            <Button trailingIcon={ArrowRight}>Next</Button>
            <Button disabled>Disabled</Button>
          </Button.Group>
          <Button.Group size={size} accessibilityLabel="Pager">
            <Button iconOnly leadingIcon={ArrowLeft} accessibilityLabel="Previous" />
            <Button iconOnly leadingIcon={ArrowRight} accessibilityLabel="Next" />
          </Button.Group>
          <SelectableGroup size={size} />
        </View>
      ))}
    </View>
  ),
};

/** One pane with flush item hit targets; no nested item material. */
export const Material: Story = {
  args: {},
  parameters: { controls: { include: ['size', 'dividers'] } },
  render: (args) => (
    <View style={{ padding: 24, alignItems: 'flex-start', backgroundColor: '#dcece6' }}>
      <Button.Group {...args} accessibilityLabel="Floating actions">
        <Button iconOnly leadingIcon={ArrowLeft} accessibilityLabel="Back" />
        <Button leadingIcon={Plus}>Add</Button>
        <Button iconOnly leadingIcon={ArrowRight} accessibilityLabel="Next" />
      </Button.Group>
    </View>
  ),
};

/** Standalone and grouped controls share the same size, glyphs and toggle behavior. */
export const StandaloneAndGrouped: Story = {
  render: function StandaloneAndGrouped(args) {
    const [pressed, setPressed] = useState(false);
    const [count, setCount] = useState(0);
    return (
      <View style={{ gap: 20, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Button
            size={args.size}
            appearance="outline"
            tone="neutral"
            icon={ArrowLeft}
            accessibilityLabel="Back"
          />
          <Button.Group {...args} accessibilityLabel="Actions">
            <Button
              icon={Plus}
              accessibilityLabel="Add"
              onPress={() => setCount((value) => value + 1)}
            />
            <Button pressed={pressed} onPressedChange={setPressed}>
              Pinned
            </Button>
            <Button disabled>Disabled</Button>
          </Button.Group>
          <Button
            size={args.size}
            appearance="outline"
            tone="neutral"
            pressed={pressed}
            onPressedChange={setPressed}
          >
            Pinned
          </Button>
        </View>
        <Button
          appearance="plain"
          tone="neutral"
          accessibilityLabel={`Added ${count}`}
          onPress={() => setCount(0)}
        >
          Added {count} · reset
        </Button>
      </View>
    );
  },
};
