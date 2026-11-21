import type { NodeKind } from '../node';
import { CAROUSELS } from './carousel';
import { DATE_PICKERS } from './date-picker';
import type { ControlRenderer } from './draw';
import { LISTS } from './list';
import { RATINGS } from './rating';
import { STAT_BARS } from './stat-bar';
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
};
