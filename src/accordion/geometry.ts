import type { BloomSize } from '../appearance';

const GEOMETRY = {
  xs: { fontSize: 12, paddingVertical: 8, gap: 6, contentPaddingBottom: 8, chevronSize: 'xs' },
  sm: { fontSize: 13, paddingVertical: 10, gap: 8, contentPaddingBottom: 10, chevronSize: 'sm' },
  md: { fontSize: 15, paddingVertical: 12, gap: 8, contentPaddingBottom: 12, chevronSize: 'sm' },
  lg: { fontSize: 17, paddingVertical: 14, gap: 10, contentPaddingBottom: 14, chevronSize: 'md' },
} as const;

export function resolveAccordionGeometry(size: BloomSize) {
  return GEOMETRY[size];
}
