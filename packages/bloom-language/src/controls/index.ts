import type { NodeKind } from '../node';
import type { ControlRenderer } from './draw';
import { INPUTS } from './inputs';
import { OVERLAYS } from './overlays';
import { CONTAINERS } from './containers';
import { SETTINGS } from './settings';
import { DATE_PICKERS } from './date-picker';
import { RATINGS } from './rating';
import { STAT_BARS } from './stat-bar';

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
};
