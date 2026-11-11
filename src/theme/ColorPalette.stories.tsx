import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from './index.web';
import { COLOR_PRESET_REGISTRY } from './color-presets';
import { getResolvedTokens } from './token-registry';
import { BORDER_WIDTH } from '../design-tokens/scales';
import { Text } from '../typography';

const meta: Meta = {
  id: 'foundations-color-palette',
  title: 'Foundations/Color/Palette',
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

/**
 * Every role Bloom resolves per preset, from the page down to the strongest ink.
 * Bloom colour is role based, not a 50 to 950 ramp: a preset has no shade 300,
 * so the rows are the roles an app actually reads.
 */
const ROLES = [
  ['--background', 'Background'],
  ['--card', 'Card'],
  ['--muted', 'Muted'],
  ['--accent', 'Accent fill'],
  ['--border', 'Border'],
  ['--primary-subtle', 'Identity subtle'],
  ['--primary', 'Identity'],
  ['--primary-text', 'Identity text'],
  ['--ring', 'Focus ring'],
] as const;

const SWATCH = { width: 56, height: 32 } as const;
/** Presets per block, so the grid fits a normal canvas without scrolling sideways. */
const PER_BLOCK = 10;
const LABEL_WIDTH = 112;

/**
 * Presets as columns, roles as rows, in the mode the toolbar selects. Each cell
 * resolves its own preset and mode through the colour engine, so the grid never
 * depends on the active theme; only the labels and hairlines read from it.
 * Hover a cell for its value.
 */
export const Palette: Story = {
  render: function PaletteStory() {
    const { colors, mode } = useTheme();
    const columns = COLOR_PRESET_REGISTRY.map((preset) => ({
      preset,
      tokens: getResolvedTokens(preset.name, mode),
    }));
    const blocks = Array.from({ length: Math.ceil(columns.length / PER_BLOCK) }, (_, index) =>
      columns.slice(index * PER_BLOCK, (index + 1) * PER_BLOCK),
    );
    return (
      <View style={{ gap: 24 }}>
        <Text variant="caption-1-regular" style={{ color: colors.textSecondary }}>
          {columns.length} presets, {mode} mode
        </Text>
        {blocks.map((block) => (
          <View key={block[0]!.preset.name} style={{ flexDirection: 'row' }}>
            <View style={{ width: LABEL_WIDTH }}>
              <View style={{ height: SWATCH.width + 4 }} />
              {ROLES.map(([token, label]) => (
                <View key={token} style={{ height: SWATCH.height, justifyContent: 'center' }}>
                  <Text variant="caption-1-regular" style={{ color: colors.text }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
            {block.map(({ preset, tokens }) => (
              <View key={preset.name} style={{ width: SWATCH.width }}>
                <View style={{ height: SWATCH.width + 4, justifyContent: 'flex-end' }}>
                  <Text
                    variant="caption-2-regular"
                    numberOfLines={1}
                    style={{
                      color: colors.text,
                      width: SWATCH.width * 1.6,
                      transform: [{ rotate: '-45deg' }, { translateX: 8 }],
                      transformOrigin: 'left bottom',
                    }}
                  >
                    {preset.displayName}
                  </Text>
                </View>
                {ROLES.map(([token, label]) => (
                  <View
                    key={token}
                    // react-native-web forwards `title`, the native tooltip.
                    {...({
                      title: `${preset.displayName} · ${label} · ${tokens[token]}`,
                    } as object)}
                    style={{
                      width: SWATCH.width,
                      height: SWATCH.height,
                      backgroundColor: tokens[token],
                      borderWidth: BORDER_WIDTH.hairline,
                      borderColor: colors.border,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  },
};
