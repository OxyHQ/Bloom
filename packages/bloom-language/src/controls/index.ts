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
import { AGENT_AVATARS } from './agent-avatar';

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
  ...AGENT_AVATARS,
};
