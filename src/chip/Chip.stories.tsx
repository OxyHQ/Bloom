import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiCheckLine } from '../icons/remix';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import type { AccentFill, AccentTone } from '../theme/accent-colors';
import { Chip, ChipRow, type ChipHue } from './index';

const meta: Meta<typeof Chip> = {
  title: 'Base/Chip',
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const FILLS: AccentFill[] = ['solid', 'subtle', 'outlined'];

/**
 * Tone × fill. The colours come from `theme/accent-colors.ts`, the one resolver
 * `Chip` and `Badge` share. `subtle` is the one worth looking at: its background
 * and its label are a resolved PAIR, not a token with alpha appended — the
 * version that appended alpha rendered a chip at contrast 1.00, drawn correctly
 * and unreadable.
 */
export const Tones: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {FILLS.map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {TONES.map((color) => (
            <Chip key={color} variant={variant} color={color} testID={`chip-${variant}-${color}`}>
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
  render: function HueChips() {
    const theme = useTheme();
    return (
      <View style={{ gap: 12, padding: 16, backgroundColor: theme.colors.background }}>
        {(['medium', 'large', 'small'] as const).map((size) => (
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

/** Icons inside the pill are sized to the pill, not to whatever was passed. */
export const WithIcons: Story = {
  render: function IconChips() {
    const theme = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Chip size="small" startIcon={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
          Small
        </Chip>
        <Chip size="medium" startIcon={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
          Medium
        </Chip>
        <Chip size="large" startIcon={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}>
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
              variant="subtle"
              selected={selected.includes(id)}
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
  render: function RemovableChips() {
    const [tags, setTags] = useState(['design', 'react-native', 'accessibility']);
    return (
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: 380 }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            color="primary"
            variant="subtle"
            onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
            {tag}
          </Chip>
        ))}
        {tags.length === 0 ? <Chip variant="outlined">nothing left</Chip> : null}
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
  render: () => (
    <View style={{ width: 240, flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
      <Chip>A long-ish label</Chip>
      <Chip>Another one</Chip>
      <Chip>And a third</Chip>
    </View>
  ),
};

export const Disabled: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip disabled onPress={() => {}}>
        Disabled
      </Chip>
      <Chip disabled variant="solid" color="primary" onPress={() => {}}>
        Disabled
      </Chip>
    </View>
  ),
};

/**
 * The five rungs. The scale used to stop at `large` (28 tall, 6px sides), which
 * is why five families grew a pill of their own rather than use this one: 28
 * with 6px sides is a TAG, and a filter you tap needs a target. `xl` is the
 * filter/segment pill, `2xl` the filters-sheet pill.
 */
export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      {(['small', 'medium', 'large', 'xl', '2xl'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Chip size={size} variant="subtle" color="primary" testID={`chip-size-${size}`}>
            {size}
          </Chip>
          <Chip size={size} variant="outlined" startIcon={<RiCheckLine width={16} height={16} />}>
            with an icon
          </Chip>
        </View>
      ))}
    </View>
  ),
};

/**
 * `inverted` is the fourth fill and a different idea rather than a fourth
 * loudness: a hairline on the page at rest, and selected it turns the page's own
 * reading pair OVER — fill `text`, label `background`. That pair is legible by
 * construction in both modes and under every preset, which is what a filters
 * sheet needs and what promoting to the brand tone cannot promise.
 *
 * The `2xl` rung also pins a `minWidth` of 48, so a one-character count ("1",
 * "8+") is a pill rather than a dot.
 */
export const Inverted: Story = {
  render: function InvertedStory() {
    const [count, setCount] = useState<number | null>(null);
    return (
      <View style={{ gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip size="2xl" variant="inverted" role="radio" selected={count == null} onPress={() => setCount(null)}>
            Any
          </Chip>
          {[1, 2, 3, 4].map((n) => (
            <Chip
              key={n}
              size="2xl"
              variant="inverted"
              role="radio"
              selected={count === n}
              onPress={() => setCount(n)}
              accessibilityLabel={String(n)}
            >
              {String(n)}
            </Chip>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip size="xl" variant="inverted" onPress={() => {}}>
            Rest
          </Chip>
          <Chip size="xl" variant="inverted" selected onPress={() => {}}>
            Selected
          </Chip>
          <Chip size="xl" variant="inverted" disabled onPress={() => {}}>
            Disabled
          </Chip>
        </View>
      </View>
    );
  },
};

/**
 * `ChipRow` is the pill row that scrolls sideways with a fade at whichever edge
 * has more behind it. Without the fade a clipped pill stops mid-glyph and reads
 * as a rendering fault rather than as "there is more". Pass `fadeColor` when the
 * row sits on anything but the page background — the row cannot know what is
 * behind it.
 */
export const Row: Story = {
  render: function RowStory() {
    const [value, setValue] = useState('all');
    const OPTIONS = ['All', 'Playlists', 'Artists', 'Albums', 'Podcasts', 'Audiobooks', 'Downloaded', 'Shared'];
    return (
      <View style={{ width: 320 }}>
        <ChipRow accessibilityLabel="Library filters" testID="chip-row">
          {OPTIONS.map((label) => (
            <Chip
              key={label}
              size="xl"
              selected={value === label.toLowerCase()}
              onPress={() => setValue(label.toLowerCase())}
              accessibilityLabel={label}
            >
              {label}
            </Chip>
          ))}
        </ChipRow>
      </View>
    );
  },
};

/**
 * A pressable chip's ROLE decides which state attribute it carries, and the
 * three are not interchangeable: a toggle `button` is `aria-pressed`, a `radio`
 * is `aria-checked`, a `tab` is `aria-selected`. `aria-pressed` on a tab is
 * invalid ARIA, and it is what this component used to emit for every one.
 */
export const Roles: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip size="xl" role="button" selected onPress={() => {}}>
        button
      </Chip>
      <Chip size="xl" role="radio" selected onPress={() => {}}>
        radio
      </Chip>
      <Chip size="xl" role="tab" selected onPress={() => {}}>
        tab
      </Chip>
    </View>
  ),
};
