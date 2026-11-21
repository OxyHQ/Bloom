import type { NodeKind } from '../node';
import { ACCORDIONS } from './accordion';
import { ACTIVITY_HEATMAPS } from './activity-heatmap';
import { BREADCRUMBS } from './breadcrumb';
import { CAROUSELS } from './carousel';
import { CODES } from './code';
import { DATE_PICKERS } from './date-picker';
import { FILE_UPLOADS } from './file-upload';
import type { ControlRenderer } from './draw';
import { LISTS } from './list';
import { MARKDOWN } from './markdown';
import { RATINGS } from './rating';
import { SLIDERS } from './slider';
import { STAT_BARS } from './stat-bar';
import { STEPPERS } from './stepper';
import { TABLES } from './table';
import { TAG_FIELDS } from './tag-field';
import { TOOLTIPS } from './tooltip';
import { VIDEOS } from './video-view';

/**
 * The renderer of each control kind: the Bloom components the language draws
 * as they are (pickers, meters, tables, lists…), each family in its own file.
 */
export const CONTROLS: Partial<Record<NodeKind, ControlRenderer>> = {
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
};
