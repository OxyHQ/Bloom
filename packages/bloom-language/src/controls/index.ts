import type { NodeKind } from '../node';
import { ACCORDIONS } from './accordion';
import { CAROUSELS } from './carousel';
import { CODES } from './code';
import { DATE_PICKERS } from './date-picker';
import type { ControlRenderer } from './draw';
import { LISTS } from './list';
import { MARKDOWN } from './markdown';
import { RATINGS } from './rating';
import { SLIDERS } from './slider';
import { STAT_BARS } from './stat-bar';
import { STEPPERS } from './stepper';
import { TABLES } from './table';

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
};
