import type { NodeKind } from '../node';
import type { ControlRenderer } from './draw';
import { INPUTS } from './inputs';
import { OVERLAYS } from './overlays';
import { CONTAINERS } from './containers';
import { SETTINGS } from './settings';
import { DATE_PICKERS } from './date-picker';
import { RATINGS } from './rating';
import { STAT_BARS } from './stat-bar';
import { TABLES } from './table';
import { LISTS } from './list';
import { CAROUSELS } from './carousel';
import { MARKDOWN } from './markdown';
import { SLIDERS } from './slider';
import { ACCORDIONS } from './accordion';
import { CODES } from './code';
import { STEPPERS } from './stepper';
import { TOOLTIPS } from './tooltip';
import { BREADCRUMBS } from './breadcrumb';
import { ACTIVITY_HEATMAPS } from './activity-heatmap';
import { TAG_FIELDS } from './tag-field';
import { FILE_UPLOADS } from './file-upload';
import { VIDEOS } from './video-view';
import { GALLERIES } from './zoomable-media-gallery';
import { INPUT_GROUPS } from './input-group';
import { PHONE_INPUTS } from './phone-input';
import { AVATAR_FLIGHTS } from './avatar-flight';
import { CATEGORY_BARS } from './category-bar';
import { MEDIA_FLIGHTS } from './media-flight';
import { CHOICE_LISTS } from './choice-list';
import { VIDEO_PLAYBACK } from './video-playback';
import { COLOR_SWATCH_PICKERS } from './color-swatch-picker';
import { INPUT_OTPS } from './input-otp';
import { ANIMATED_CHECKS } from './animated-check';
import { SPINNER_ICONS } from './spinner-icon';
import { CONTEXT_MENUS } from './context-menu';
import { COLLAPSIBLES } from './collapsible';
import { DROP_ZONES } from './drop-zone';
import { MEDIA_INSET_BORDERS } from './media-inset-border';
import { FACT_STRIPS } from './fact-strip';
import { SORTABLE_MEDIA } from './sortable-media';
import { HOVER_CARDS } from './hover-card';
import { EXPANDABLE_TEXTS } from './expandable-text';
import { MENUBARS } from './menubar';
import { COMPOSITION_BARS } from './composition-bar';
import { NOTIFICATIONS } from './notification';
import { LINK_PREVIEWS } from './link-preview';
import { SOCIAL_BUTTONS } from './social-button';
import { DATA_TABLES } from './data-table';
import { SORTABLE_CHIP_ROWS } from './sortable-chip-row';
import { VIEWPORTS } from './viewport';
import { GLASS_GROUPS } from './glass-group';
import { TOOLBAR_GROUPS } from './toolbar-group';
import { VIEWS_THAT_FIT } from './view-that-fits';
import { AGENT_AVATARS } from './agent-avatar';
import { CHAT_COMPOSERS } from './chat-composer';
import { CHART_CARDS } from './chart-cards';
import { COMPOSER_PANELS } from './composer-panel';
import { AI_CHATS } from './ai-chat';
import { STAT_CARDS } from './stat-cards';
import { MEDIA_CONTROLS } from './media-controls';
import { AGENTS } from './agents';
import { CHATS } from './chat';
import { LISTINGS } from './listings';
import { MEDIA } from './media';
import { CARD_FORMS } from './card-form';
import { CHECKOUT_SHEETS } from './checkout-sheet';
import { STAY_FILTERS } from './stay-filters';
import { STAY_SEARCH } from './stay-search';
import { TENANCY } from './tenancy';
import { EVICTION } from './eviction';
import { PLACE_REVIEWS } from './place-reviews';
import { CALL_UIS } from './call-ui';
import { CHAT_PEOPLE } from './chat-people';
import { MESSAGE_BUBBLES } from './message-bubble';
import { MAP_CHROME } from './map-chrome';
import { PLACES } from './places';
import { MAILS } from './mail';
import { BOOKINGS } from './booking';
import { HOME_SEARCHES } from './home-search';
import { LISTING_ACTIONS } from './listing-actions';
import { LISTING_CARDS } from './listing-card';
import { LISTING_EDITORS } from './listing-editor';
import { OFFERING_BADGES } from './offering-badge';
import { PROPERTY_INSIGHTS } from './property-insights';
import { PROJECT_BOARDS } from './project-board';
import { ACTIVITY_FEEDS } from './activity-feed';
import { ORDER_STATUSES } from './order-status';
import { LOCKUPS } from './lockup';
import { AMBIENT_PHOTOS } from './ambient-photo';
import { CALENDAR_VIEWS } from './calendar';
import { TASK_LISTS } from './task-list';
import { WEB_SEARCHES } from './web-search';
import { VOICES } from './voice';
import { AGENT_CREATORS } from './agent-creator';
import { AGENT_REPLIES } from './agent-reply';
import { AI_PROFILE_CARDS } from './ai-profile-card';
import { MULTI_AGENT_CHATS } from './multi-agent-chat';
import { AGENT_CHATS } from './agent-chat';
import { ROUTE_STOPS } from './route-stops';
import { NOTE_CARDS } from './note-card';
import { SHARE_SHEETS } from './share-sheet';
import { GENERIC } from './generic';
import { ADDRESSES } from './address';
import { PAYMENT_METHODS } from './payment-method';
import { PRICE_BREAKDOWNS } from './price-breakdown';
import { PAYMENT_STATUSES } from './payment-status';
import { CRM } from './crm';
import { DASHBOARD_CARDS } from './dashboard-cards';
import { CARTS } from './cart-panel';
import { MENU_ITEMS } from './menu-item';
import { VENDOR_CARDS } from './vendor-card';
import { MEDIA_CARDS } from './media-cards';
import { LYRICS } from './lyrics';
import { CREATOR_STUDIO } from './creator-studio';
import { CHECKOUT_SUMMARIES } from './checkout-summary';
import { DELIVERY_SLOTS } from './delivery-slot';
import { ORDER_CONFIRMATIONS } from './order-confirmation';
import { MEDIA_PLAYERS } from './media-player';
import { LOGISTICS } from './logistics';
import { MUSIC_LIBRARY } from './music-library';
import { QUEUE_PANELS } from './queue-panel';
import { TRACK_LISTS } from './track-list';

/**
 * The renderer of each control kind: the Bloom components the language draws
 * as they are, each family in its own file (inputs, overlays, containers,
 * settings rows, pickers, meters, tables, lists, the product families…).
 */
export const CONTROLS: Partial<Record<NodeKind, ControlRenderer>> = {
  ...INPUTS,
  ...OVERLAYS,
  ...CONTAINERS,
  ...SETTINGS,
  ...DATE_PICKERS,
  ...RATINGS,
  ...STAT_BARS,
  ...TABLES,
  ...LISTS,
  ...CAROUSELS,
  ...MARKDOWN,
  ...SLIDERS,
  ...ACCORDIONS,
  ...CODES,
  ...STEPPERS,
  ...TOOLTIPS,
  ...BREADCRUMBS,
  ...ACTIVITY_HEATMAPS,
  ...TAG_FIELDS,
  ...FILE_UPLOADS,
  ...VIDEOS,
  ...GALLERIES,
  ...INPUT_GROUPS,
  ...PHONE_INPUTS,
  ...AVATAR_FLIGHTS,
  ...CATEGORY_BARS,
  ...MEDIA_FLIGHTS,
  ...CHOICE_LISTS,
  ...VIDEO_PLAYBACK,
  ...COLOR_SWATCH_PICKERS,
  ...INPUT_OTPS,
  ...ANIMATED_CHECKS,
  ...SPINNER_ICONS,
  ...CONTEXT_MENUS,
  ...COLLAPSIBLES,
  ...DROP_ZONES,
  ...MEDIA_INSET_BORDERS,
  ...FACT_STRIPS,
  ...SORTABLE_MEDIA,
  ...HOVER_CARDS,
  ...EXPANDABLE_TEXTS,
  ...MENUBARS,
  ...COMPOSITION_BARS,
  ...NOTIFICATIONS,
  ...LINK_PREVIEWS,
  ...SOCIAL_BUTTONS,
  ...DATA_TABLES,
  ...SORTABLE_CHIP_ROWS,
  ...VIEWPORTS,
  ...GLASS_GROUPS,
  ...TOOLBAR_GROUPS,
  ...VIEWS_THAT_FIT,
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
  ...TASK_LISTS,
  ...WEB_SEARCHES,
  ...VOICES,
  ...AGENT_CREATORS,
  ...AGENT_REPLIES,
  ...AI_PROFILE_CARDS,
  ...MULTI_AGENT_CHATS,
  ...AGENT_CHATS,
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
  ...CHECKOUT_SUMMARIES,
  ...DELIVERY_SLOTS,
  ...ORDER_CONFIRMATIONS,
  ...MEDIA_PLAYERS,
  ...LOGISTICS,
  ...MUSIC_LIBRARY,
  ...QUEUE_PANELS,
  ...TRACK_LISTS,
};
