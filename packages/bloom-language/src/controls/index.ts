import type { NodeKind } from '../node';
import { ACCORDIONS } from './accordion';
import { ACTIVITY_HEATMAPS } from './activity-heatmap';
import { BREADCRUMBS } from './breadcrumb';
import { CAROUSELS } from './carousel';
import { CODES } from './code';
import { CONTAINERS } from './containers';
import { CONTEXT_MENUS } from './context-menu';
import { HOVER_CARDS } from './hover-card';
import { MENUBARS } from './menubar';
import { DATE_PICKERS } from './date-picker';
import { FILE_UPLOADS } from './file-upload';
import type { ControlRenderer } from './draw';
import { SOCIAL_BUTTONS } from './social-button';
import { LINK_PREVIEWS } from './link-preview';
import { NOTIFICATIONS } from './notification';
import { COMPOSITION_BARS } from './composition-bar';
import { SORTABLE_MEDIA } from './sortable-media';
import { EXPANDABLE_TEXTS } from './expandable-text';
import { DROP_ZONES } from './drop-zone';
import { COLLAPSIBLES } from './collapsible';
import { FACT_STRIPS } from './fact-strip';
import { ANIMATED_CHECKS } from './animated-check';
import { INPUTS } from './inputs';
import { LISTS } from './list';
import { MARKDOWN } from './markdown';
import { OVERLAYS } from './overlays';
import { RATINGS } from './rating';
import { SLIDERS } from './slider';
import { STAT_BARS } from './stat-bar';
import { STEPPERS } from './stepper';
import { TABLES } from './table';
import { TAG_FIELDS } from './tag-field';
import { TOOLTIPS } from './tooltip';
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
import { MEDIA_INSET_BORDERS } from './media-inset-border';

/**
 * The renderer of each control kind: the Bloom components the language draws
 * as they are (inputs, overlays, containers, pickers, meters, tables, lists…),
 * each family in its own file.
 */
export const CONTROLS: Partial<Record<NodeKind, ControlRenderer>> = {
  ...INPUTS,
  ...OVERLAYS,
  ...CONTAINERS,
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
};
