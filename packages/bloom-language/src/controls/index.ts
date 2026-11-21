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
import { COLOR_SWATCH_PICKERS } from './color-swatch-picker';
import { INPUT_OTPS } from './input-otp';
import { ANIMATED_CHECKS } from './animated-check';
import { CONTEXT_MENUS } from './context-menu';

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
  ...COLOR_SWATCH_PICKERS,
  ...INPUT_OTPS,
  ...ANIMATED_CHECKS,
  ...CONTEXT_MENUS,
};
