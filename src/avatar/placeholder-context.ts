import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface AvatarPlaceholderConfig {
  /** Default icon to render inside the placeholder circle */
  icon?: (size: number) => ReactNode;
}

const AvatarPlaceholderContext = createContext<AvatarPlaceholderConfig | null>(null);
AvatarPlaceholderContext.displayName = 'BloomAvatarPlaceholderContext';

export const AvatarPlaceholderProvider = AvatarPlaceholderContext.Provider;

export function useAvatarPlaceholder(): AvatarPlaceholderConfig | null {
  return useContext(AvatarPlaceholderContext);
}
