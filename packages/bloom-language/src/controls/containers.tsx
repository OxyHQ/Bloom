import type { ControlRenderer } from './draw';

/** Containers: cards, rows, grouped sections, chips and notices. */
export type ContainerKind = never;

/** The renderer of each kind in this family. */
export const CONTAINERS: Partial<Record<ContainerKind, ControlRenderer>> = {};
