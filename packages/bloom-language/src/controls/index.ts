import type { NodeKind } from '../node';
import { DASHBOARD_CARDS } from './dashboard-cards';
import { CRM } from './crm';
import { AGENT_AVATARS } from './agent-avatar';
import { CHECKOUT_SHEETS } from './checkout-sheet';
import { LYRICS } from './lyrics';
import { MEDIA_CARDS } from './media-cards';
import { PAYMENT_METHODS } from './payment-method';
import { ADDRESSES } from './address';
import { VENDOR_CARDS } from './vendor-card';
import { MENU_ITEMS } from './menu-item';
import { CARTS } from './cart-panel';
import { PAYMENT_STATUSES } from './payment-status';
import { PRICE_BREAKDOWNS } from './price-breakdown';
import { CREATOR_STUDIO } from './creator-studio';
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
import { ROUTE_STOPS } from './route-stops';
import { NOTE_CARDS } from './note-card';
import { SHARE_SHEETS } from './share-sheet';
import { GENERIC } from './generic';
import type { ControlRenderer } from './draw';
import { INPUTS } from './inputs';
import { OVERLAYS } from './overlays';

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
  ...ROUTE_STOPS,
  ...NOTE_CARDS,
  ...SHARE_SHEETS,
  ...GENERIC,
  ...ADDRESSES,
  ...PAYMENT_METHODS,
  ...PRICE_BREAKDOWNS,
  ...PAYMENT_STATUSES,
  ...CRM,
  ...DASHBOARD_CARDS,
  ...CARTS,
  ...MENU_ITEMS,
  ...VENDOR_CARDS,
  ...MEDIA_CARDS,
  ...LYRICS,
  ...CREATOR_STUDIO,
};
