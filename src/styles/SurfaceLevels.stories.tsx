import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';

import { Checkbox } from '../checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Button } from '../button';
import { Tabs, TabsTrigger } from '../tabs';
import { TextField, TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SURFACE_LEVELS, SurfaceLevelProvider, resolveSurfaceLevel, type SurfaceLevel } from './surface-levels';

/**
 * The surface ladder, drawn.
 *
 * Each rung shows the two controls whose fills used to COLLIDE with a card
 * surface — a text field and a tab strip — so the step (or its absence) is the
 * thing on screen rather than a number in a test.
 */
const meta: Meta = {
  title: 'Base/Surface Levels',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function Rung({ level }: { level: SurfaceLevel }) {
  const theme = useTheme();
  const paint = resolveSurfaceLevel(theme, level);
  return (
    <SurfaceLevelProvider level={level}>
      <View
        style={{
          backgroundColor: paint.background,
          borderWidth: 1,
          borderColor: paint.border,
          borderRadius: 16,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16,
          gap: 12,
        }}
      >
        <Text variant="body-medium" style={{ color: paint.text }}>
          Level {level} — {paint.background}
        </Text>
        <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
          Secondary label, floored at 7:1 on this fill
        </Text>
        <Text variant="caption-1-regular" style={{ color: paint.textTertiary }}>
          Tertiary caption, floored at 4.5:1 on this fill
        </Text>
        <TextField>
          <TextFieldInput label="Search" placeholder="A field steps off this surface" testID={`field-${level}`} />
        </TextField>
        <Tabs value="one" onValueChange={() => {}}>
          <TabsTrigger value="one" label="Overview" />
          <TabsTrigger value="two" label="Activity" />
        </Tabs>
        <Checkbox
          checked={false}
          onCheckedChange={() => {}}
          label="A focused ring's gap takes this fill"
        />
      </View>
    </SurfaceLevelProvider>
  );
}

export const Ladder: StoryObj = {
  render: () => {
    const theme = useTheme();
    return (
      <View style={{ backgroundColor: theme.colors.background, padding: 24, gap: 16 }}>
        {SURFACE_LEVELS.map((level) => (
          <Rung key={level} level={level} />
        ))}
      </View>
    );
  },
};

/**
 * The case the ladder exists for: a field inside a popover. The panel publishes
 * level 1, so the field steps off the PANEL. Before, both were `neutral-800` in
 * dark — 1.000:1, no shell at all.
 */
export const FieldInsideAPopover: StoryObj = {
  render: () => {
    const theme = useTheme();
    return (
      <View style={{ backgroundColor: theme.colors.background, padding: 24, minHeight: 420 }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open</Button>
          </PopoverTrigger>
          <PopoverContent>
            <View style={{ gap: 12, padding: 12, minWidth: 260 }}>
              <TextField>
                <TextFieldInput label="Search" placeholder="Search" testID="field-in-popover" />
              </TextField>
              <Tabs value="one" onValueChange={() => {}}>
                <TabsTrigger value="one" label="All" />
                <TabsTrigger value="two" label="Mine" />
              </Tabs>
            </View>
          </PopoverContent>
        </Popover>
      </View>
    );
  },
};
