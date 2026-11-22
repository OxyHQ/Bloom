import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';

import type { ParityCase } from '../../parity/support/cases';
import { PROPERTY_INSIGHT_CASES } from '../../parity/property-insights.cases';
import { LISTING_EDITOR_CASES } from '../../parity/listing-editor.cases';
import { LISTING_CARD_CASES } from '../../parity/listing-card.cases';
import { LISTING_ACTION_CASES } from '../../parity/listing-actions.cases';
import { AGENT_AVATAR_CASES } from '../../parity/agent-avatar.cases';
import { AGENT_CASES } from '../../parity/agents.cases';
import { AI_CHAT_CASES } from '../../parity/ai-chat.cases';
import { CARD_FORM_CASES } from '../../parity/card-form.cases';
import { CHART_CARD_CASES } from '../../parity/chart-cards.cases';
import { CHAT_CASES } from '../../parity/chat.cases';
import { CHAT_COMPOSER_CASES } from '../../parity/chat-composer.cases';
import { CHECKOUT_SHEET_CASES } from '../../parity/checkout-sheet.cases';
import { CALL_UI_CASES } from '../../parity/call-ui.cases';
import { CHAT_PEOPLE_CASES } from '../../parity/chat-people.cases';
import { MESSAGE_BUBBLE_CASES } from '../../parity/message-bubble.cases';
import { PLACE_CASES } from '../../parity/places.cases';
import { MAIL_CASES } from '../../parity/mail.cases';
import { MAP_CHROME_CASES } from '../../parity/map-chrome.cases';
import { PROJECT_BOARD_CASES } from '../../parity/project-board.cases';
import { ACTIVITY_FEED_CASES } from '../../parity/activity-feed.cases';
import { ORDER_STATUS_CASES } from '../../parity/order-status.cases';
import { LOCKUP_CASES } from '../../parity/lockup.cases';
import { CALENDAR_CASES } from '../../parity/calendar.cases';
import { ENGAGEMENT_CASES } from '../../parity/engagement.cases';
import { VOICE_CASES } from '../../parity/voice.cases';
import { WEB_SEARCH_CASES } from '../../parity/web-search.cases';
import { TASK_LIST_CASES } from '../../parity/task-list.cases';
import { AGENT_EDITOR_CASES } from '../../parity/agent-editor.cases';
import { AGENT_CHAT_CASES } from '../../parity/agent-chats.cases';
import { COMPOSER_PANEL_CASES } from '../../parity/composer-panel.cases';
import { LISTINGS_MEDIA_CASES } from '../../parity/listings-media.cases';
import { MEDIA_CONTROL_CASES } from '../../parity/media-controls.cases';
import { STAT_CARD_CASES } from '../../parity/stat-cards.cases';
import { STAY_FILTER_CASES } from '../../parity/stay-filters.cases';
import { STAY_SEARCH_CASES } from '../../parity/stay-search.cases';
import { TENANCY_CASES } from '../../parity/tenancy.cases';
import { EVICTION_CASES } from '../../parity/eviction.cases';
import { BOOKING_CASES } from '../../parity/booking.cases';
import { HOME_SEARCH_CASES } from '../../parity/home-search.cases';
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
export const StayFilters: Story = { args: { cases: STAY_FILTER_CASES } };
export const StaySearch: Story = { args: { cases: STAY_SEARCH_CASES } };
export const Tenancy: Story = { args: { cases: TENANCY_CASES } };
export const EvictionsAndReviews: Story = { args: { cases: EVICTION_CASES } };
export const CallScreens: Story = { args: { cases: CALL_UI_CASES } };
export const ChatPeople: Story = { args: { cases: CHAT_PEOPLE_CASES } };
export const MessageBubbles: Story = { args: { cases: MESSAGE_BUBBLE_CASES } };
export const MapChrome: Story = { args: { cases: MAP_CHROME_CASES } };
export const Places: Story = { args: { cases: PLACE_CASES } };
export const Mail: Story = { args: { cases: MAIL_CASES } };
export const Booking: Story = { args: { cases: BOOKING_CASES } };
export const HomeSearch: Story = { args: { cases: HOME_SEARCH_CASES } };
export const ListingActions: Story = { args: { cases: LISTING_ACTION_CASES } };
export const ListingCards: Story = { args: { cases: LISTING_CARD_CASES } };
export const ListingEditor: Story = { args: { cases: LISTING_EDITOR_CASES } };
export const PropertyInsights: Story = { args: { cases: PROPERTY_INSIGHT_CASES } };
export const ProjectBoards: Story = { args: { cases: PROJECT_BOARD_CASES } };
export const ActivityFeeds: Story = { args: { cases: ACTIVITY_FEED_CASES } };
export const OrderStatus: Story = { args: { cases: ORDER_STATUS_CASES } };
export const Lockups: Story = { args: { cases: LOCKUP_CASES } };
export const Calendars: Story = { args: { cases: CALENDAR_CASES } };
export const Engagement: Story = { args: { cases: ENGAGEMENT_CASES } };
export const TaskLists: Story = { args: { cases: TASK_LIST_CASES } };
export const WebSearches: Story = { args: { cases: WEB_SEARCH_CASES } };
export const VoiceControls: Story = { args: { cases: VOICE_CASES } };
export const AgentEditor: Story = { args: { cases: AGENT_EDITOR_CASES } };
export const AgentChats: Story = { args: { cases: AGENT_CHAT_CASES } };
