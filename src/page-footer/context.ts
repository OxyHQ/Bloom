import { createContext } from 'react';
import type { EdgeStore } from '../layout/edge-store';

// Local scroll clearance, deliberately separate from the global bottom edge
// that positions this footer. Publishing there would make it avoid itself.
export const PageFooterContext = createContext<EdgeStore | null>(null);
