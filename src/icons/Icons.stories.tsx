import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Icons from './index';
import type { Props as IconProps } from './shared';
import { Text } from '../typography';
import { Search } from '../search';
import { useTheme } from '../theme';

const meta: Meta = {
  title: 'Foundations/Icons',
};

export default meta;

type Story = StoryObj;

type IconComponent = React.ComponentType<IconProps>;

/**
 * Every exported icon, by name. The export list is the source of truth — a
 * hand-maintained gallery would go stale the first time an icon is added, and
 * silently, because a missing entry looks exactly like an icon that does not
 * exist.
 */
function useIconEntries(): Array<[string, IconComponent]> {
  return useMemo(() => {
    const entries: Array<[string, IconComponent]> = [];
    for (const [name, value] of Object.entries(Icons)) {
      // The barrel also re-exports the shared size scale, which is a plain
      // object — so "starts with a capital" is not enough on its own.
      if (!/^[A-Z]/.test(name)) continue;
      const isComponent =
        typeof value === 'function' ||
        (typeof value === 'object' && value !== null && '$$typeof' in value);
      if (!isComponent) continue;
      entries.push([name, value as unknown as IconComponent]);
    }
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, []);
}

function Cell({ name, Icon }: { name: string; Icon: IconComponent }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 132, alignItems: 'center', gap: 6, paddingVertical: 12 }}>
      <Icon size="lg" fill={colors.text} />
      <Text style={{ fontSize: 10, textAlign: 'center' }} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

/**
 * The naming is `<Subject>_<Stroke2|Filled>_Corner0_Rounded`, and the suffix is
 * not decoration — it is which drawing you get. Import the exact identifier and
 * alias it locally; a shortened name in a doc comment or an `.mdx` example is
 * invisible to `tsc`, which is why `icon-references.test.ts` exists.
 *
 * Colour travels on `fill`, size on `size`. Neither is inherited from a parent
 * `Text`, so an icon beside a label needs to be told both.
 */
export const Browser: Story = {
  render: function BrowserStory() {
    const entries = useIconEntries();
    const [query, setQuery] = useState('');
    const filtered = query.trim()
      ? entries.filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
      : entries;

    return (
      <View style={{ width: 820, gap: 12 }}>
        <Search value={query} onChangeText={setQuery} onClearText={() => setQuery('')} />
        <Text>
          {filtered.length} of {entries.length} icons
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {filtered.map(([name, Icon]) => (
            <Cell key={name} name={name} Icon={Icon} />
          ))}
        </View>
      </View>
    );
  },
};

/** The size ramp, on one glyph, so the steps are comparable. */
export const Sizes: Story = {
  render: function SizesStory() {
    const { colors } = useTheme();
    const Bell = Icons.Bell_Stroke2_Corner0_Rounded;
    return (
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-end' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <View key={size} style={{ alignItems: 'center', gap: 6 }}>
            <Bell size={size} fill={colors.text} />
            <Text style={{ fontSize: 11 }}>{size}</Text>
          </View>
        ))}
      </View>
    );
  },
};

/**
 * Stroke and filled are separate exports rather than a prop, because they are
 * different drawings. Filled reads as "on"/selected; stroke as the resting
 * state — a tab bar uses both for the same subject.
 */
export const StrokeAndFilled: Story = {
  render: function StrokeAndFilledStory() {
    const { colors } = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icons.Star_Stroke2_Corner0_Rounded size="xl" fill={colors.text} />
          <Text style={{ fontSize: 11 }}>Stroke2</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icons.Star_Filled_Corner0_Rounded size="xl" fill={colors.primary} />
          <Text style={{ fontSize: 11 }}>Filled</Text>
        </View>
      </View>
    );
  },
};
