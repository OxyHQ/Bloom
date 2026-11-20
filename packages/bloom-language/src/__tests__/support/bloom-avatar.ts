export const Avatar = 'BloomAvatar';
// Bloom's avatar rungs, from `src/avatar/initials.ts`; checked against that file's text (`tokens.test.ts`).
export const AVATAR_SIZES = { xs: 20, sm: 24, md: 32, lg: 36 } as const;
export type AvatarSizeToken = keyof typeof AVATAR_SIZES;
