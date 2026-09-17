import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiAncientGateLine } from '../icons/remix/RiAncientGateLine';
import { RiAncientPavilionLine } from '../icons/remix/RiAncientPavilionLine';
import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiCactusLine } from '../icons/remix/RiCactusLine';
import { RiDropLine } from '../icons/remix/RiDropLine';
import { RiEqualizerLine } from '../icons/remix/RiEqualizerLine';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiGamepadLine } from '../icons/remix/RiGamepadLine';
import { RiGolfBallLine } from '../icons/remix/RiGolfBallLine';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiLandscapeLine } from '../icons/remix/RiLandscapeLine';
import { RiPlantLine } from '../icons/remix/RiPlantLine';
import { RiRestaurantLine } from '../icons/remix/RiRestaurantLine';
import { RiSailboatLine } from '../icons/remix/RiSailboatLine';
import { RiSeedlingLine } from '../icons/remix/RiSeedlingLine';
import { RiShip2Line } from '../icons/remix/RiShip2Line';
import { RiSnowflakeLine } from '../icons/remix/RiSnowflakeLine';
import { RiSunLine } from '../icons/remix/RiSunLine';
import { RiTentLine } from '../icons/remix/RiTentLine';
import { RiTreeLine } from '../icons/remix/RiTreeLine';
import { Switch } from '../switch';
import { BloomThemeProvider } from '../theme';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CategoryBar } from './CategoryBar';
import type { CategoryBarItem } from './types';

const meta: Meta<typeof CategoryBar> = {
  title: 'Blocks/Stays/Category Bar',
  component: CategoryBar,
};

export default meta;

type Story = StoryObj<typeof CategoryBar>;

const CATEGORIES: CategoryBarItem[] = [
  { key: 'trending', label: 'Trending', icon: RiFireLine },
  { key: 'beachfront', label: 'Beachfront', icon: RiSunLine },
  { key: 'cabins', label: 'Cabins', icon: RiTreeLine },
  { key: 'views', label: 'Amazing views', icon: RiLandscapeLine },
  { key: 'lakefront', label: 'Lakefront', icon: RiSailboatLine },
  { key: 'camping', label: 'Camping', icon: RiTentLine },
  { key: 'countryside', label: 'Countryside', icon: RiPlantLine },
  { key: 'design', label: 'Design', icon: RiBuilding2Line },
  { key: 'castles', label: 'Castles', icon: RiAncientGateLine },
  { key: 'historic', label: 'Historic homes', icon: RiAncientPavilionLine },
  { key: 'arctic', label: 'Arctic', icon: RiSnowflakeLine },
  { key: 'desert', label: 'Desert', icon: RiCactusLine },
  { key: 'pools', label: 'Pools', icon: RiDropLine },
  { key: 'golfing', label: 'Golfing', icon: RiGolfBallLine },
  { key: 'kitchens', label: "Chef's kitchens", icon: RiRestaurantLine },
  { key: 'play', label: 'Play', icon: RiGamepadLine },
  { key: 'cycling', label: 'Cycling', icon: RiBikeLine },
  { key: 'houseboats', label: 'Houseboats', icon: RiShip2Line },
  { key: 'tiny', label: 'Tiny homes', icon: RiHome4Line },
  { key: 'farms', label: 'Farms', icon: RiSeedlingLine },
];

function FiltersButton({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <Badge content={count} placement="top-right" invisible={count === 0}>
      {compact ? (
        <Button
          variant="outline"
          size="medium"
          iconOnly
          leadingIcon={RiEqualizerLine}
          accessibilityLabel={`Filters, ${count} applied`}
        />
      ) : (
        <Button
          variant="outline"
          size="medium"
          leadingIcon={RiEqualizerLine}
          accessibilityLabel={`Filters, ${count} applied`}
        >
          Filters
        </Button>
      )}
    </Badge>
  );
}

function Frame({
  width,
  caption,
  children,
}: {
  width: number;
  caption: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {caption}
      </Text>
      <View
        style={{
          width,
          maxWidth: '100%',
          paddingLeft: width < 600 ? 16 : 40,
          paddingRight: width < 600 ? 16 : 40,
          borderBottomWidth: 1,
          borderColor: theme.isDark ? n[800] : n[200],
          backgroundColor: theme.colors.background,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Bar({ width, initial = 'trending' }: { width: number; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <CategoryBar
      items={CATEGORIES}
      value={value}
      onValueChange={setValue}
      accessibilityLabel="Categories"
      trailing={<FiltersButton count={3} compact={width < 600} />}
      testID={`bar-${width}`}
    />
  );
}

/**
 * The strip at 1280, 768 and 375 with a Filters button pinned right. Hover
 * the strip on web: the arrows appear only on a side with more to scroll, and
 * each scrolls about a page. Tab onto the selected item and use the arrow keys.
 */
export const Widths: Story = {
  render: function CategoryBarWidths() {
    const theme = useTheme();
    return (
      <View style={{ gap: 24, padding: 16, backgroundColor: theme.colors.background }}>
        <Frame width={1280} caption="1280">
          <Bar width={1280} />
        </Frame>
        <Frame width={768} caption="768">
          <Bar width={768} initial="kitchens" />
        </Frame>
        <Frame width={375} caption="375">
          <Bar width={375} />
        </Frame>
      </View>
    );
  },
};

/** A trailing switch row instead of a button. */
export const TrailingSwitch: Story = {
  render: function CategoryBarTrailingSwitch() {
    const theme = useTheme();
    const { neutral: n } = resolveButtonRamps(theme);
    const [value, setValue] = useState('cabins');
    const [total, setTotal] = useState(false);
    return (
      <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
        <Frame width={1280} caption="Trailing switch">
          <CategoryBar
            items={CATEGORIES}
            value={value}
            onValueChange={setValue}
            accessibilityLabel="Categories"
            trailing={
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  height: 48,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.isDark ? n[700] : n[200],
                }}
              >
                <Text variant="body-2-medium" style={{ color: theme.colors.text }}>
                  Display total before taxes
                </Text>
                <Switch value={total} onValueChange={setTotal} accessibilityLabel="Display total before taxes" />
              </View>
            }
          />
        </Frame>
      </View>
    );
  },
};

/** Few enough items to fit: no arrows at all, no trailing slot. */
export const Fits: Story = {
  render: function CategoryBarFits() {
    const theme = useTheme();
    const [value, setValue] = useState('beachfront');
    return (
      <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
        <Frame width={768} caption="Six items">
          <CategoryBar
            items={CATEGORIES.slice(0, 6)}
            value={value}
            onValueChange={setValue}
            accessibilityLabel="Categories"
          />
        </Frame>
      </View>
    );
  },
};

/** The same strips in dark mode. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <DarkBody />
    </BloomThemeProvider>
  ),
};

function DarkBody() {
  const theme = useTheme();
  return (
    <View style={{ gap: 24, padding: 16, backgroundColor: theme.colors.background }}>
      <Frame width={1280} caption="1280">
        <Bar width={1280} initial="arctic" />
      </Frame>
      <Frame width={375} caption="375">
        <Bar width={375} />
      </Frame>
    </View>
  );
}
