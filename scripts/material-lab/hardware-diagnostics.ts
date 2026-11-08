import { createContext } from 'react';
export type LightDiagnosticLayer = 'all' | 'bloom' | 'glow' | 'line' | 'none';
export const LightDiagnosticLayerContext = createContext<LightDiagnosticLayer>('all');

export const LightClockDiagnosticsContext = createContext(false);
