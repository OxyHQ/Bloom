import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiCheckLine } from '../icons/remix';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import type { BloomAppearance, BloomTone } from '../appearance';
import { Chip, type ChipHue } from './index';

const meta: Meta<typeof Chip> = {
  argTypes: {
    "appearance": { control: 'select', options: ["solid","subtle","outline","plain"] },
    "tone": { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    "hue": { control: 'select', options: ["neutral","blue","lime","rose","yellow","cyan","purple","gray","soft"] },
    "surface": { control: 'text' },
    "size": { control: 'select', options: ["xs","sm","md","lg"] },
    "checked": { control: 'boolean' },
    "disabled": { control: 'boolean' }
  },
  title: 'Base/Chip',
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

const TONES: BloomTone[] = ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'];
const FILLS: BloomAppearance[] = ['solid', 'subtle', 'outline'];

/**
 * Tone × fill. The colours come from `theme/accent-colors.ts`, the one resolver
 * `Chip` and `Badge` share. `subtle` is the one worth looking at: its background
 * and its label are a resolved PAIR, not a token with alpha appended — the
 * version that appended alpha rendered a chip at contrast 1.00, drawn correctly
 * and unreadable.
 */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {TONES.map((color) => (
            <Chip key={color} appearance={variant} tone={color} testID={`chip-${variant}-${color}`}>
              {`${variant}/${color}`}
            </Chip>
          ))}
        </View>
      ))}
    </View>
  ),
};

const HUES: ChipHue[] = ['lime', 'rose', 'yellow', 'cyan', 'blue', 'purple', 'neutral', 'gray', 'soft'];

/**
 * Data hues — `hue` instead of `color` + `variant`. Rows are the
 * three emphasis levels: `bold` (`medium`), `subtle` (`large`) and `caption`
 * (`small`). The dark fills are translucent and are pre-mixed over
 * the page background; `surface` names another one.
 */
export const Hues: Story = {
  parameters: { controls: { disable: true } },
  render: function HueChips() {
    const theme = useTheme();
    return (
      <View style={{ gap: 12, padding: 16, backgroundColor: theme.colors.background }}>
        {(['md', 'lg', 'sm'] as const).map((size) => (
          <View key={size} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {HUES.map((hue) => (
              <Chip key={hue} size={size} hue={hue} testID={`chip-hue-${size}-${hue}`}>
                {hue}
              </Chip>
            ))}
          </View>
        ))}
      </View>
    );
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
    </View>
  ),
};

/** Icons inside the pill are sized to the pill, not to whatever was passed. */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: function IconChips() {
    const theme = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Chip size="sm" leading={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
          Small
        </Chip>
        <Chip size="md" leading={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
          Medium
        </Chip>
        <Chip size="lg" leading={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
          Large
        </Chip>
      </View>
    );
  },
};

/**
 * Filter pills. `selected` is the filter-row state: it promotes the chip to the
 * brand tone rather than to a colour system of its own, and announces as a
 * pressed toggle, which is why it needs `onPress` rather than a caller-drawn
 * highlight. Tab onto one in a browser to see the `:focus-visible` ring — it is
 * keyboard-only, so a mouse click leaves none.
 */
export const Selectable: Story = {
  parameters: { controls: { disable: true } },
  render: function SelectableChips() {
    const [selected, setSelected] = useState<string[]>(['news']);
    const toggle = (id: string) =>
      setSelected((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      );
    return (
      <View style={{ gap: 12 }}>
        <Text>selected: {selected.join(', ') || 'none'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['news', 'sport', 'music', 'travel'].map((id) => (
            <Chip
              key={id}
              testID={`chip-${id}`}
              appearance="subtle"
              checked={selected.includes(id)}
              onPress={() => toggle(id)}>
              {id}
            </Chip>
          ))}
        </View>
      </View>
    );
  },
};

/**
 * Removable tags. `onClose` adds the dismiss affordance, which is its own
 * control inside the pill; `onPress` makes the body pressable.
 */
export const Removable: Story = {
  parameters: { controls: { disable: true } },
  render: function RemovableChips() {
    const [tags, setTags] = useState(['design', 'react-native', 'accessibility']);
    return (
      <View style={{ maxWidth: '100%', flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: 380 }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            tone="accent"
            appearance="subtle"
            onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
            {tag}
          </Chip>
        ))}
        {tags.length === 0 ? <Chip appearance="outline">nothing left</Chip> : null}
      </View>
    );
  },
};

/**
 * A pill does not shrink. In a row narrower than its contents the chips keep
 * their size and the row overflows, rather than each pill squeezing its label
 * into an ellipsis.
 */
export const DoesNotShrink: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 240, flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
      <Chip>A long-ish label</Chip>
      <Chip>Another one</Chip>
      <Chip>And a third</Chip>
    </View>
  ),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip disabled onPress={() => {}}>
        Disabled
      </Chip>
      <Chip disabled appearance="solid" tone="accent" onPress={() => {}}>
        Disabled
      </Chip>
    </View>
  ),
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { children: 'Notifications', size: 'md', tone: 'accent', appearance: 'subtle', checked: false, disabled: false },
  render: function PlaygroundChip(args) { const [, updateArgs] = useArgs(); return <Chip {...args} onCheckedChange={(checked) => updateArgs({ checked })} />; },
};
