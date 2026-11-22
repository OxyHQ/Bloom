import type { NodeKind } from '../node';
import { CALL_UIS } from './call-ui';
import { CHAT_PEOPLE } from './chat-people';
import { MESSAGE_BUBBLES } from './message-bubble';
import { AGENT_AVATARS } from './agent-avatar';
import { PROPERTY_INSIGHTS } from './property-insights';
import { OFFERING_BADGES } from './offering-badge';
import { LISTING_EDITORS } from './listing-editor';
import { LISTING_CARDS } from './listing-card';
import { LISTING_ACTIONS } from './listing-actions';
import { HOME_SEARCHES } from './home-search';
import { BOOKINGS } from './booking';
import { CHECKOUT_SHEETS } from './checkout-sheet';
import { STAY_FILTERS } from './stay-filters';
import { STAY_SEARCH } from './stay-search';
import { TENANCY } from './tenancy';
import { EVICTION } from './eviction';
import { PLACE_REVIEWS } from './place-reviews';
import { PROJECT_BOARDS } from './project-board';
import { ACTIVITY_FEEDS } from './activity-feed';
import { ORDER_STATUSES } from './order-status';
import { LOCKUPS } from './lockup';
import { AMBIENT_PHOTOS } from './ambient-photo';
import { CALENDAR_VIEWS } from './calendar';
import { CARD_FORMS } from './card-form';
import { MEDIA } from './media';
import { LISTINGS } from './listings';
import { CHATS } from './chat';
import { AGENTS } from './agents';
import { MEDIA_CONTROLS } from './media-controls';
import { STAT_CARDS } from './stat-cards';
import { AI_CHATS } from './ai-chat';
import { COMPOSER_PANELS } from './composer-panel';
import { CHART_CARDS } from './chart-cards';
import { CHAT_COMPOSERS } from './chat-composer';
import { CONTAINERS } from './containers';
import type { ControlRenderer } from './draw';
import { INPUTS } from './inputs';
import { OVERLAYS } from './overlays';
import { PLACES } from './places';
import { MAILS } from './mail';
import { MAP_CHROME } from './map-chrome';

/**
 * The renderer of each control kind: the Bloom components apps compose most
 * (inputs, overlays, feedback, containers), each family in its own file.
 */
export const CONTROLS: Partial<Record<NodeKind, ControlRenderer>> = {
  ...INPUTS,
  ...OVERLAYS,
  ...CONTAINERS,
  ...AGENT_AVATARS,
  ...CHAT_COMPOSERS,
  ...CHART_CARDS,
  ...COMPOSER_PANELS,
  ...AI_CHATS,
  ...STAT_CARDS,
  ...MEDIA_CONTROLS,
  ...AGENTS,
  ...CHATS,
  ...LISTINGS,
  ...MEDIA,
  ...CARD_FORMS,
  ...CHECKOUT_SHEETS,
  ...STAY_FILTERS,
  ...STAY_SEARCH,
  ...TENANCY,
  ...EVICTION,
  ...PLACE_REVIEWS,
  ...CALL_UIS,
  ...CHAT_PEOPLE,
  ...MESSAGE_BUBBLES,
  ...MAP_CHROME,
  ...PLACES,
  ...MAILS,
  ...BOOKINGS,
  ...HOME_SEARCHES,
  ...LISTING_ACTIONS,
  ...LISTING_CARDS,
  ...LISTING_EDITORS,
  ...OFFERING_BADGES,
  ...PROPERTY_INSIGHTS,
  ...PROJECT_BOARDS,
  ...ACTIVITY_FEEDS,
  ...ORDER_STATUSES,
  ...LOCKUPS,
  ...AMBIENT_PHOTOS,
  ...CALENDAR_VIEWS,
};
