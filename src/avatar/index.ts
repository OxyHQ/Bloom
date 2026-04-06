export { Avatar } from './Avatar';
export { AvatarPlaceholderProvider } from './placeholder-context';
export type { AvatarPlaceholderConfig } from './placeholder-context';
export type { AvatarProps, AvatarShape } from './types';

// ESM static import works in both Metro (RN 0.72+) and web bundlers (Vite, webpack).
import defaultAvatar from './default-avatar.jpg';

/** Default avatar placeholder image — use as `fallbackSource` on Avatar or in AvatarPlaceholderProvider */
export const defaultAvatarSource = defaultAvatar;
