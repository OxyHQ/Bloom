import type React from 'react';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
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
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CategoryBar } from './CategoryBar';
import type { CategoryBarItem } from './types';

const meta: Meta<typeof CategoryBar> = {
  id: 'blocks-stays-category-bar',
  title: 'Components/Navigation/Category Bar',
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

function Frame({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 1280, padding: 16 }}>{children}</View>;
}
export const Responsive: Story = {
  render: function ResponsiveCategoryBar() {
    const [value, setValue] = useState('trending');
    const [filtered, setFiltered] = useState(false);
    const compact = useWindowDimensions().width < 600;
    return (
      <Frame>
        <CategoryBar
          items={CATEGORIES}
          value={value}
          onValueChange={setValue}
          accessibilityLabel="Categories"
          trailing={
            <Badge content={filtered ? 1 : 0} invisible={!filtered}>
              <Button
                icon={compact ? RiEqualizerLine : undefined}
                leadingIcon={compact ? undefined : RiEqualizerLine}
                accessibilityLabel="Filter categories"
                pressed={filtered}
                onPressedChange={setFiltered}
              >
                {compact ? undefined : 'Filters'}
              </Button>
            </Badge>
          }
        />
        <Text>
          {value}
          {filtered ? ' · Filter applied' : ''}
        </Text>
      </Frame>
    );
  },
};
export const TrailingSwitch: Story = {
  render: function CategoryBarTrailingSwitch() {
    const theme = useTheme();
    const { neutral: n } = resolveButtonRamps(theme);
    const [value, setValue] = useState('cabins');
    const [total, setTotal] = useState(false);
    return (
      <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
        <Frame>
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
                <Switch
                  checked={total}
                  onCheckedChange={setTotal}
                  accessibilityLabel="Display total before taxes"
                />
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
        <Frame>
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
