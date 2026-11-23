// Bloom's icon size rungs, from `src/icons/shared.tsx`; its module pulls the
// theme provider, so the table is checked against that file's text instead
// (`tokens.test.ts`).
export const sizes = {
  '2xs': 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
} as const;
