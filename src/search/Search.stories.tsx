import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Search, type SearchToken } from './index';
import { RiFilePdf2Line } from '../icons/remix/RiFilePdf2Line';
import { RiPriceTag3Line } from '../icons/remix/RiPriceTag3Line';
import { RiCalendarLine } from '../icons/remix/RiCalendarLine';
import { Button } from '../button';
import { Text } from '../typography';

const meta: Meta<typeof Search> = {
  id: 'base-search',
  title: 'Components/Inputs/Search',
  component: Search,
};

export default meta;

type Story = StoryObj<typeof Search>;

/**
 * `Search` is `TextField` at the pill rung with the magnifier and the clear
 * button already wired, plus `role="search"` and the autocorrect/autocapitalize
 * settings a query field wants. Building it from `TextField` by hand is how
 * three apps ended up with three different clear buttons.
 */
export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: function BasicStory() {
    const [value, setValue] = useState('');
    return (
      <View style={{ width: 380, maxWidth: '100%' }}>
        <Search value={value} onValueChange={setValue} onClearText={() => setValue('')} />
      </View>
    );
  },
};

/**
 * The clear button appears only while there is a value, and `onClearText` is
 * what it calls — a separate prop from `onChangeText` so the caller can also
 * drop the results, not just the text.
 */
export const Filtering: Story = {
  parameters: { controls: { disable: true } },
  render: function FilteringStory() {
    const ALL = ['Nate', 'Bloom', 'Homiio', 'Mention', 'Allo', 'Mercaria'];
    const [value, setValue] = useState('m');
    const shown = ALL.filter((x) => x.toLowerCase().includes(value.toLowerCase()));
    return (
      <View style={{ width: 380, maxWidth: '100%', gap: 12 }}>
        <Search
          value={value}
          onValueChange={setValue}
          onClearText={() => setValue('')}
          label="Search apps"
        />
        <View style={{ gap: 4 }}>
          {shown.map((x) => (
            <Text key={x}>{x}</Text>
          ))}
          {shown.length === 0 ? <Text>No matches</Text> : null}
        </View>
      </View>
    );
  },
};

/** A custom `label` replaces both the floating label and the placeholder. */
export const CustomLabel: Story = {
  parameters: { controls: { disable: true } },
  render: function CustomLabelStory() {
    const [value, setValue] = useState('');
    return (
      <View style={{ width: 380, maxWidth: '100%' }}>
        <Search
          value={value}
          onValueChange={setValue}
          onClearText={() => setValue('')}
          label="Find a conversation"
        />
      </View>
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof Search> = {
  args: { label: 'Find a conversation', value: '' },
  parameters: { controls: { disable: false, include: ['label', 'value'] } },
  argTypes: { label: { control: 'text' }, value: { control: 'text' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ width: 440, maxWidth: '100%' }}>
        <Search
          {...args}
          onValueChange={(next) => updateArgs({ value: next })}
          onClearText={() => updateArgs({ value: '' })}
        />
      </View>
    );
  },
};

/** Independent layout and surface slots keep the input and clear control intact. */
export const StyledSlots: Story = {
  render: function StyledSlotsStory() {
    const [value, setValue] = useState('');
    const [disabled, setDisabled] = useState(false);
    const [invalid, setInvalid] = useState(false);
    return (
      <View style={{ width: 480, gap: 16 }}>
        <Search label="Default search" value="" />
        <Search
          label="Styled search"
          value={value}
          onValueChange={setValue}
          onClearText={() => setValue('')}
          disabled={disabled}
          invalid={invalid}
          containerClassName="bloom-demo-search-container"
          fieldClassName="bloom-demo-search-field"
          fieldChromeClassName="bloom-demo-search-chrome"
        />
        <Button onPress={() => setDisabled((value) => !value)}>Toggle disabled</Button>
        <Button onPress={() => setInvalid((value) => !value)}>Toggle invalid</Button>
      </View>
    );
  },
};

export const CustomAffordances: Story = {
  render: function CustomAffordancesStory() {
    const [value, setValue] = useState(
      'A long search query to verify the clear control never overlaps text',
    );
    const [disabled, setDisabled] = useState(false);
    return (
      <View style={{ width: 320, gap: 20 }}>
        <Search
          label="Custom search"
          value={value}
          onValueChange={setValue}
          onClearText={() => setValue('')}
          iconSize={24}
          clearButtonProps={{ size: 24, glyphSize: 24 }}
          disabled={disabled}
          fieldClassName="bloom-demo-search-layout"
          fieldChromeClassName="bloom-demo-search-chrome"
          style={{ fontSize: 16, lineHeight: 20 }}
        />
        <Button onPress={() => setDisabled((v) => !v)}>Toggle disabled</Button>
      </View>
    );
  },
};

/**
 * Filters as tokens inside the field, before the text: each has a remove
 * button, and Backspace with the caret at the start of the text removes the
 * last. The clear button clears the whole query, so `onClearText` empties the
 * text and the tokens. Narrow the frame to see a long row scroll, the latest
 * token kept beside the caret.
 */
export const Tokens: Story = {
  parameters: { controls: { disable: true } },
  render: function TokensStory() {
    const ALL: readonly SearchToken[] = [
      { key: 'kind', label: 'Kind: PDF', icon: RiFilePdf2Line },
      { key: 'tag', label: 'Tag: Work', icon: RiPriceTag3Line },
      { key: 'date', label: 'Modified: This week', icon: RiCalendarLine },
    ];
    const [value, setValue] = useState('report');
    const [tokens, setTokens] = useState<readonly SearchToken[]>(ALL);
    return (
      <View style={{ width: 380, maxWidth: '100%', gap: 12 }}>
        <Search
          value={value}
          onValueChange={setValue}
          tokens={tokens}
          onRemoveToken={(key) => setTokens((current) => current.filter((t) => t.key !== key))}
          onClearText={() => {
            setValue('');
            setTokens([]);
          }}
          label="Search files"
        />
        <Button onPress={() => setTokens(ALL)}>Restore tokens</Button>
      </View>
    );
  },
};
