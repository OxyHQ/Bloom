import { Text } from '../typography';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useInteractionState } from '../hooks/use-interaction-state';
import { hoverGroupProps, SubtleHover } from './index';

const meta: Meta<typeof SubtleHover> = {
  id: 'base-subtle-hover',
  title: 'Composition/Motion/Subtle Hover',
  component: SubtleHover,
};

export default meta;

type Story = StoryObj<typeof SubtleHover>;

/**
 * The hover group: the parent spreads `hoverGroupProps` and the wash fades in
 * on hover with ZERO React state (web only).
 */
function HoverRow({ label }: { label: string }) {
  return (
    <Pressable
      {...hoverGroupProps}
      accessibilityLabel={label}
      style={{
        width: 280,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SubtleHover style={{ borderRadius: 12 }} />
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export const GroupHover: Story = {
  parameters: { controls: { disable: true } },
  render: () => <HoverRow label="Hover me (web, group-hover)" />,
};

export const Stack: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 4 }}>
      <HoverRow label="Inbox" />
      <HoverRow label="Sent" />
      <HoverRow label="Drafts" />
    </View>
  ),
};

/**
 * JS `active` mode: hovering anywhere in the thread lights EVERY row together
 * (a coordinated highlight a per-element `group-hover` can't express). `native`
 * is opted in so the same wash shows on native surfaces too.
 */
export const CoordinatedThread: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    function Thread() {
      const { state: hovered, onIn, onOut } = useInteractionState();
      return (
        <Pressable onHoverIn={onIn} onHoverOut={onOut} style={{ gap: 4 }}>
          {['First reply', 'Second reply', 'Third reply'].map((label) => (
            <View
              key={label}
              style={{
                width: 280,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <SubtleHover active={hovered} native style={{ borderRadius: 12 }} />
              <Text style={{ fontWeight: '600' }}>{label}</Text>
            </View>
          ))}
        </Pressable>
      );
    }
    return <Thread />;
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof SubtleHover> = {
  args: { active: true },
  parameters: { controls: { disable: false, include: ['active'] } },
  argTypes: { active: { control: 'boolean' } },
  render: function Playground(args) {
    return (
      <View style={{ width: 440, maxWidth: '100%' }}>
        <View style={{ height: 72, justifyContent: 'center', padding: 16 }}>
          <SubtleHover {...args} />
          <Text>Hover surface preview</Text>
        </View>
      </View>
    );
  },
};
