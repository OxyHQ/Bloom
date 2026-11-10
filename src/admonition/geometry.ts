import type { BloomSize } from '../appearance';

export const ADMONITION_GEOMETRY: Record<
  BloomSize,
  {
    padding: number;
    rowGap: number;
    icon: number;
    contentGap: number;
    fontSize: number;
    lineHeight: number;
  }
> = {
  xs: { padding: 8, rowGap: 8, icon: 16, contentGap: 2, fontSize: 12, lineHeight: 18 },
  sm: { padding: 12, rowGap: 10, icon: 18, contentGap: 3, fontSize: 13, lineHeight: 20 },
  md: { padding: 16, rowGap: 12, icon: 20, contentGap: 4, fontSize: 14, lineHeight: 22 },
  lg: { padding: 20, rowGap: 16, icon: 24, contentGap: 6, fontSize: 16, lineHeight: 24 },
};
