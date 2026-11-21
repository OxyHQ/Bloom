import type { ReactNode } from 'react';

import type { Child } from '../node';
import { resolveSpace, type SpaceToken } from '../tokens';
import type { ControlDraw } from './draw';

/**
 * A product component's slot: a language child drawn where the component puts
 * it, or `undefined` when none is given (so the component's own default, which
 * an absent prop draws, stays).
 */
export function slot(d: ControlDraw, child: Child | undefined): ReactNode {
  return child === undefined ? undefined : d.render(child);
}

/** A length a product component takes as a number, given as a space token. */
export function length(token: SpaceToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveSpace(token);
}
