export { Avatar } from './Avatar';
export { AvatarPlaceholderProvider } from './placeholder-context';
export type { AvatarPlaceholderConfig } from './placeholder-context';
export type { AvatarProps, AvatarShape } from './types';

// Inlined as a base64 data URI so consumers compiling Bloom's source directly
// do not need ambient `*.jpg` module declarations or a `.jpg` asset loader.
import defaultAvatar from './default-avatar';

/** Default avatar placeholder image — use as `fallbackSource` on Avatar or in AvatarPlaceholderProvider */
export const defaultAvatarSource = defaultAvatar;
