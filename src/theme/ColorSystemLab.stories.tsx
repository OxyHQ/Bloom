import { View } from 'react-native';
import { useGlobals } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialTemplate } from '../../templates/social/SocialTemplate';
import { Button } from '../button';
import { Text } from '../typography';
import {
  COLOR_PRESET_FAMILY_REGISTRY,
  COLOR_PRESET_REGISTRY,
  type ColorPresetFamily,
  type ColorPresetPairing,
} from './color-presets';
import { getResolvedTokens } from './token-registry';

interface LabArgs {
  authenticated: boolean;
  family: 'all' | ColorPresetFamily;
  pairing: 'all' | ColorPresetPairing;
}

const meta: Meta<LabArgs> = {
  title: 'Foundations/Color System Playground',
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  args: { authenticated: true, family: 'all', pairing: 'curated' },
  argTypes: {
    authenticated: { control: 'boolean' },
    family: {
      control: 'select',
      options: ['all', ...COLOR_PRESET_FAMILY_REGISTRY.map((f) => f.name)],
    },
    pairing: { control: 'select', options: ['all', 'curated', 'derived'] },
  },
};
export default meta;

const ROLES = ['background', 'surface', 'popover', 'card', 'primary', 'tertiary'] as const;

/** Swatches deliberately paint the exact resolved token: Surface material would change it. */
function Palette({
  preset,
  mode,
}: {
  preset: (typeof COLOR_PRESET_REGISTRY)[number]['name'];
  mode: 'light' | 'dark';
}) {
  const tokens = getResolvedTokens(preset, mode);
  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption-1-medium">{mode}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROLES.map((role) => (
          <View key={role} style={{ gap: 4, width: 88 }}>
            <View
              accessibilityLabel={`${mode} ${role}: ${tokens[`--${role}`]}`}
              style={{ height: 32, backgroundColor: tokens[`--${role}`] }}
            />
            <Text variant="caption-1-regular">{role}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const Playground: StoryObj<LabArgs> = {
  render: function Playground({ authenticated, family, pairing }) {
    const [globals, updateGlobals] = useGlobals();
    const recipes = COLOR_PRESET_REGISTRY.filter(
      (recipe) =>
        (family === 'all' || recipe.family === family) &&
        (pairing === 'all' || recipe.pairing === pairing),
    );
    return (
      <>
        <View style={{ padding: 16, gap: 24 }}>
          <Text variant="title-2-semibold">Color recipes</Text>
          <Text>
            Compare the token pairs, then choose a recipe to see it in context. Appearance follows
            the Storybook toolbar.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            {recipes.map((recipe) => (
              <View key={recipe.name} style={{ gap: 12, flexBasis: 300, flexGrow: 1, minWidth: 0 }}>
                <Button
                  pressed={recipe.name === globals.colorPreset}
                  onPress={() => updateGlobals({ colorPreset: recipe.name })}
                >
                  {recipe.displayName}
                </Button>
                <Text variant="caption-1-regular">{recipe.description}</Text>
                <Palette preset={recipe.name} mode="light" />
                <Palette preset={recipe.name} mode="dark" />
              </View>
            ))}
          </View>
        </View>
        <SocialTemplate authenticated={authenticated} />
      </>
    );
  },
};
