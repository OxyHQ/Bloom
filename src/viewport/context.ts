import { createContext } from 'react';
import type { ViewportHandle } from './types';

export interface ViewportScope {
  parent: ViewportScope | null;
  getNode: (() => ViewportHandle | null) | null;
  listeners: Set<() => void>;
}
export const ViewportContext = createContext<ViewportScope | null>(null);
