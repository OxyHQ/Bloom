import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';

import type { ParityCase } from '../../parity/support/cases';
import { AGENT_AVATAR_CASES } from '../../parity/agent-avatar.cases';
import { AI_CHAT_CASES } from '../../parity/ai-chat.cases';
import { CHART_CARD_CASES } from '../../parity/chart-cards.cases';
import { CHAT_COMPOSER_CASES } from '../../parity/chat-composer.cases';
import { COMPOSER_PANEL_CASES } from '../../parity/composer-panel.cases';
import { AVATAR_CASES } from '../../parity/avatar.cases';
import { BUTTON_CASES } from '../../parity/button.cases';
import { ICON_CASES, ICON_CASES_EVERY } from '../../parity/icon.cases';
import { LAYOUT_CASES } from '../../parity/layout.cases';
import { PIECES_CASES } from '../../parity/pieces.cases';
import { MATERIAL_CASES } from '../../parity/material.cases';
import { TEXT_CASES } from '../../parity/text.cases';
import { VARIANT_CASES } from '../../parity/variants.cases';

/**
 * Each language node beside the Bloom element it stands for: the same cases
 * the parity suite compares (`parity/*.cases.tsx`). `scripts/verify-parity-web.mjs`
 * compares each pair's computed styles in a browser; a reader compares them by eye.
 */
function ParityTable({ cases }: { cases: readonly ParityCase[] }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text variant="caption-1-semibold" style={{ width: 220 }}>
          Case
        </Text>
        <Text variant="caption-1-semibold" style={{ flex: 1 }}>
          Bloom
        </Text>
        <Text variant="caption-1-semibold" style={{ flex: 1 }}>
          Language
        </Text>
      </View>
      {cases.map((c, index) => (
        <View key={c.name} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <Text variant="caption-1-regular" style={{ width: 220 }}>
            {c.name}
          </Text>
          <View testID={`bloom-${index}`} style={{ flex: 1, alignItems: 'flex-start' }}>
            {c.bloom()}
          </View>
          <View testID={`language-${index}`} style={{ flex: 1, alignItems: 'flex-start' }}>
            {c.language()}
          </View>
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

export const TextAndTypography: Story = { args: { cases: TEXT_CASES } };
export const Icons: Story = { args: { cases: ICON_CASES } };
export const EveryIcon: Story = { args: { cases: ICON_CASES_EVERY } };
export const Material: Story = { args: { cases: MATERIAL_CASES } };
export const AvatarsAndGroups: Story = { args: { cases: AVATAR_CASES } };
export const SmallPieces: Story = { args: { cases: PIECES_CASES } };
export const Buttons: Story = { args: { cases: BUTTON_CASES } };
export const Layout: Story = { args: { cases: LAYOUT_CASES } };
export const Variants: Story = { args: { cases: VARIANT_CASES } };
export const AgentAvatars: Story = { args: { cases: AGENT_AVATAR_CASES } };
export const ChatComposers: Story = { args: { cases: CHAT_COMPOSER_CASES } };
export const ChartCards: Story = { args: { cases: CHART_CARD_CASES } };
export const ComposerPanels: Story = { args: { cases: COMPOSER_PANEL_CASES } };
export const AiChat: Story = { args: { cases: AI_CHAT_CASES } };
