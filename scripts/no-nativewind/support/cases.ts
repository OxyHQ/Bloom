import type { ReactElement } from 'react';

/** A family's parity cases: each renders what it draws, under Bloom's provider. */
export type Cases = Record<string, () => ReactElement>;
