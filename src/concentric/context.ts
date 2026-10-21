import { createContext } from 'react';
import type { ConcentricGeometry } from './types';
export interface ConcentricContextValue extends ConcentricGeometry {
  id: string;
}
export const ConcentricContext = createContext<ConcentricContextValue | null>(null);
