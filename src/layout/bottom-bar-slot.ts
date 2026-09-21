import { createContext } from 'react';

/** Bottom safe area already supplied by the measured app-shell slot. */
export const BottomBarSlotContext = createContext<number | undefined>(undefined);
