import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';

import type { ParityCase } from '../../parity/support/cases';
import { FAMILIES, type Family } from './parity-families';

/**
 * What the check reads off a cell: an isolated case's frame (`data-parity-frame`,
 * the `Language/Parity frame` story's args: each side is drawn alone in its own
 * page, since where it pins depends on where it is drawn), and a case whose
 * claim on the web is that it draws nothing (`data-parity-empty`).
 */
function claims(family: Family, index: number, c: ParityCase): Record<string, string> {
  return {
    ...(c.isolated ? { parityFrame: `family:${family};index:${index}` } : {}),
    ...(c.drawsNothing?.includes('web') ? { parityEmpty: '' } : {}),
  };
}

/**
 * Each language node beside the Bloom element it stands for: the same cases
 * the parity suite compares (`parity/*.cases.tsx`). `scripts/verify-parity-web.mjs`
 * compares each pair's computed styles in a browser; a reader compares them by eye.
 *
 * Each cell is as wide as what it draws, so neither side's size depends on
 * the other's (two cells sharing a row's width split it to a layout unit,
 * 1/64 px, apart when it does not halve). A cell carries its case's claims
 * for the check (see `claims`).
 */
function ParityTable({ family }: { family: Family }) {
  const cases: readonly ParityCase[] = FAMILIES[family];
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text variant="caption-1-semibold" style={{ width: 220 }}>
          Case
        </Text>
        <Text variant="caption-1-semibold">Bloom</Text>
        <Text variant="caption-1-semibold">Language</Text>
      </View>
      {cases.map((c, index) => (
        <View key={c.name} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <Text variant="caption-1-regular" style={{ width: 220 }}>
            {c.name}
          </Text>
          {(['bloom', 'language'] as const).map((side) => (
            <View
              key={side}
              testID={`${side}-${index}`}
              {...({ dataSet: claims(family, index, c) } as Record<string, unknown>)}
              style={{ flexShrink: 0, alignItems: 'flex-start' }}
            >
              {c[side]()}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const meta: Meta<typeof ParityTable> = {
  title: 'Language/Parity',
  component: ParityTable,
};
export default meta;

type Story = StoryObj<typeof ParityTable>;

export const TextAndTypography: Story = { args: { family: 'text' } };
export const Icons: Story = { args: { family: 'icons' } };
export const EveryIcon: Story = { args: { family: 'everyIcon' } };
export const Material: Story = { args: { family: 'material' } };
export const AvatarsAndGroups: Story = { args: { family: 'avatars' } };
export const SmallPieces: Story = { args: { family: 'pieces' } };
export const Buttons: Story = { args: { family: 'buttons' } };
export const Layout: Story = { args: { family: 'layout' } };
export const Variants: Story = { args: { family: 'variants' } };
export const Inputs: Story = { args: { family: 'input' } };
export const Containers: Story = { args: { family: 'container' } };
export const OverlaysAndFeedback: Story = { args: { family: 'overlays' } };
export const ScreenAndScrollView: Story = { args: { family: 'screen' } };
export const BottomSheetPresented: Story = { args: { family: 'sheet' } };
export const SidebarRailAndPageFooter: Story = { args: { family: 'navigation' } };
export const CommandAndSettings: Story = { args: { family: 'command' } };
export const ShellPanelsAndInspector: Story = { args: { family: 'shell' } };
export const LayoutFamily: Story = { args: { family: 'toolbar' } };
export const SettingsRows: Story = { args: { family: 'settings' } };
export const DateAndTimePickers: Story = { args: { family: 'datePicker' } };
export const Ratings: Story = { args: { family: 'rating' } };
export const MetersAndProgress: Story = { args: { family: 'statBar' } };
export const Stickers: Story = { args: { family: 'sticker' } };
export const Tables: Story = { args: { family: 'table' } };
export const RowsAndLists: Story = { args: { family: 'list' } };
export const Carousels: Story = { args: { family: 'carousel' } };
export const Markdown: Story = { args: { family: 'markdown' } };
export const Sliders: Story = { args: { family: 'slider' } };
export const Accordions: Story = { args: { family: 'accordion' } };
export const Code: Story = { args: { family: 'code' } };
export const Steppers: Story = { args: { family: 'stepper' } };
