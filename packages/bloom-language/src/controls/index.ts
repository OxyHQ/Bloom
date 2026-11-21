import type { NodeKind } from '../node';
import { CONTAINERS } from './containers';
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
};
