import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';

import type { ParityCase } from '../../parity/support/cases';
import { AGENT_AVATAR_CASES } from '../../parity/agent-avatar.cases';
import { AGENT_CASES } from '../../parity/agents.cases';
import { AI_CHAT_CASES } from '../../parity/ai-chat.cases';
import { CARD_FORM_CASES } from '../../parity/card-form.cases';
import { CHART_CARD_CASES } from '../../parity/chart-cards.cases';
import { CHAT_CASES } from '../../parity/chat.cases';
import { CHAT_COMPOSER_CASES } from '../../parity/chat-composer.cases';
import { CHECKOUT_SHEET_CASES } from '../../parity/checkout-sheet.cases';
import { MEDIA_PLAYER_CASES } from '../../parity/media-player.cases';
import { LYRICS_CASES } from '../../parity/lyrics.cases';
import { MEDIA_CARD_CASES } from '../../parity/media-cards.cases';
import { ROUTE_NOTE_SHARE_CASES } from '../../parity/route-note-share.cases';
import { GENERIC_CASES } from '../../parity/generic.cases';
import { ADDRESS_PAYMENT_CASES } from '../../parity/address-payment.cases';
import { CHECKOUT_DELIVERY_ORDER_CASES } from '../../parity/checkout-delivery-order.cases';
import { CART_MENU_VENDOR_CASES } from '../../parity/cart-menu-vendor.cases';
import { PRICE_PAYMENT_STATUS_CASES } from '../../parity/price-payment-status.cases';
import { DASHBOARD_CARD_CASES } from '../../parity/dashboard-cards.cases';
import { CRM_CASES } from '../../parity/crm.cases';
import { COMPOSER_PANEL_CASES } from '../../parity/composer-panel.cases';
import { CREATOR_STUDIO_CASES } from '../../parity/creator-studio.cases';
import { LISTINGS_MEDIA_CASES } from '../../parity/listings-media.cases';
import { MEDIA_CONTROL_CASES } from '../../parity/media-controls.cases';
import { STAT_CARD_CASES } from '../../parity/stat-cards.cases';
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
export const StatCards: Story = { args: { cases: STAT_CARD_CASES } };
export const MediaControls: Story = { args: { cases: MEDIA_CONTROL_CASES } };
export const Agents: Story = { args: { cases: AGENT_CASES } };
export const Chat: Story = { args: { cases: CHAT_CASES } };
export const ListingsAndMedia: Story = { args: { cases: LISTINGS_MEDIA_CASES } };
export const CardForms: Story = { args: { cases: CARD_FORM_CASES } };
export const CheckoutSheets: Story = { args: { cases: CHECKOUT_SHEET_CASES } };
export const RouteStopsNotesAndSharing: Story = { args: { cases: ROUTE_NOTE_SHARE_CASES } };
export const GenericComponents: Story = { args: { cases: GENERIC_CASES } };
export const AddressesAndPaymentMethods: Story = { args: { cases: ADDRESS_PAYMENT_CASES } };
export const PricesAndPaymentStatus: Story = { args: { cases: PRICE_PAYMENT_STATUS_CASES } };
export const Crm: Story = { args: { cases: CRM_CASES } };
export const DashboardCards: Story = { args: { cases: DASHBOARD_CARD_CASES } };
export const CartMenuItemsAndVendors: Story = { args: { cases: CART_MENU_VENDOR_CASES } };
export const MediaCards: Story = { args: { cases: MEDIA_CARD_CASES } };
export const Lyrics: Story = { args: { cases: LYRICS_CASES } };
export const CreatorStudio: Story = { args: { cases: CREATOR_STUDIO_CASES } };
export const CheckoutSummaryDeliveryAndOrders: Story = {
  args: { cases: CHECKOUT_DELIVERY_ORDER_CASES },
};
export const MediaPlayer: Story = { args: { cases: MEDIA_PLAYER_CASES } };
