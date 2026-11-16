import { createContext, useContext } from 'react';
import type { AppShellComposition } from './composition';

export const AppShellCompositionContext = createContext<AppShellComposition>({});
export const useAppShellComposition = () => useContext(AppShellCompositionContext);
