import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as RemixIcons from './remix';
import remixMapping from './remix-mapping.json';
import type { Props as IconProps } from './shared';
import { Text } from '../typography';
import { Search } from '../search';
import { useTheme } from '../theme';

const meta: Meta = {
  parameters: { controls: { disable: true } },
  title: 'Foundations/Icons',
};

export default meta;

type Story = StoryObj;

type IconComponent = React.ComponentType<IconProps>;

const REMIX = RemixIcons as unknown as Record<string, IconComponent>;

/**
 * Every Remix icon Bloom ships, by name. The export list of `./remix` is the
 * source of truth — a hand-maintained gallery would go stale the first time an
 * icon is added, and silently, because a missing entry looks exactly like an icon
 * that does not exist.
 */
function useIconEntries(): Array<[string, IconComponent]> {
  return useMemo(
    () =>
      Object.entries(REMIX)
        .filter(([name]) => /^Ri[A-Z0-9]/.test(name))
        .sort(([a], [b]) => a.localeCompare(b)),
    [],
  );
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
 * Bloom draws Remix Icon (Remix Icon License 1.0). Each icon is its own module
 * under `src/icons/remix`, named exactly as Remix's React package names it —
 * `RiArrowRightSLine`, `RiStarFill` — so a name found on remixicon.com is the
 * import. `Line` is the outline drawing, `Fill` the solid one.
 *
 * Colour travels on `fill`, size on `size`. Neither is inherited from a parent
 * `Text`, so an icon beside a label needs to be told both.
 */
export const Browser: Story = {
  parameters: { controls: { disable: true } },
  render: function BrowserStory() {
    const entries = useIconEntries();
    const [query, setQuery] = useState('');
    const filtered = query.trim()
      ? entries.filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
      : entries;

    return (
      <View style={{ maxWidth: '100%', width: 820, gap: 12 }}>
        <Search value={query} onValueChange={setQuery} onClearText={() => setQuery('')} />
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
  parameters: { controls: { disable: true } },
  render: function SizesStory() {
    const { colors } = useTheme();
    const Bell = RemixIcons.RiNotification3Line;
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
 * Line and Fill are separate exports rather than a prop, because they are
 * different drawings. Fill reads as "on"/selected; Line as the resting state — a
 * tab bar uses both for the same subject.
 */
export const LineAndFill: Story = {
  parameters: { controls: { disable: true } },
  render: function LineAndFillStory() {
    const { colors } = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <RemixIcons.RiStarLine size="xl" fill={colors.text} />
          <Text style={{ fontSize: 11 }}>RiStarLine</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <RemixIcons.RiStarFill size="xl" fill={colors.primary} />
          <Text style={{ fontSize: 11 }}>RiStarFill</Text>
        </View>
      </View>
    );
  },
};

/**
 * The retired Bloom icon names and the Remix component each one migrates to
 * (`src/icons/remix-mapping.json`, applied by `scripts/migrate-icons-to-remix.mjs`).
 * Filter by either name to review a mapping decision against its drawing.
 */
export const Migration: Story = {
  parameters: { controls: { disable: true } },
  render: function MigrationStory() {
    const { colors } = useTheme();
    const [query, setQuery] = useState('');
    const rows = Object.entries(remixMapping as Record<string, string>).filter(([from, to]) => {
      const q = query.trim().toLowerCase();
      return !q || from.toLowerCase().includes(q) || to.toLowerCase().includes(q);
    });

    return (
      <View style={{ maxWidth: '100%', width: 820, gap: 12 }}>
        <Search value={query} onValueChange={setQuery} onClearText={() => setQuery('')} />
        <Text>{rows.length} mappings</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {rows.map(([from, to]) => {
            const Icon = REMIX[to];
            return (
              <View
                key={from}
                style={{ width: 273, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                {Icon ? (
                  <Icon size="lg" fill={colors.text} />
                ) : (
                  <Text style={{ fontSize: 10, color: colors.negative }}>missing</Text>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10 }} numberOfLines={2}>
                    {from}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.primary }}>{to}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  },
};
