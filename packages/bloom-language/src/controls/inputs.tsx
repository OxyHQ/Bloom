import type { ControlRenderer } from './draw';

/** Inputs: text fields, toggles, pickers and search. */
export type InputKind = never;

/** The renderer of each kind in this family. */
export const INPUTS: Partial<Record<InputKind, ControlRenderer>> = {};
