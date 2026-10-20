import type { BloomSize } from './types';
import type { TypeScaleVariant } from '../typography/scale';

/** Size names express the same progression, while each control keeps its own purpose. */
export const CONTROL_LABEL_TYPE: Record<BloomSize, TypeScaleVariant> = {
  xs: 'caption-1-regular',
  sm: 'body-2-regular',
  md: 'body-regular',
  lg: 'headline-regular',
};
export const MENU_GEOMETRY = {
  xs: {
    height: 24,
    rowGap: 1,
    groupClass: 'gap-[1px]',
    separatorMargin: 3,
    separatorMarginClass: 'my-[3px]',
    icon: 16,
    gap: 6,
    rowClass: 'px-space-8 py-space-4 min-h-[24px] gap-1.5',
    gutter: 30,
  },
  sm: {
    height: 26,
    rowGap: 2,
    groupClass: 'gap-[2px]',
    separatorMargin: 2,
    separatorMarginClass: 'my-[2px]',
    icon: 18,
    gap: 6,
    rowClass: 'px-space-8 py-space-4 min-h-[26px] gap-1.5',
    gutter: 32,
  },
  md: {
    height: 28,
    rowGap: 2,
    groupClass: 'gap-[2px]',
    separatorMargin: 2,
    separatorMarginClass: 'my-[2px]',
    icon: 20,
    gap: 8,
    rowClass: 'px-space-8 py-space-4 min-h-[28px] gap-space-8',
    gutter: 36,
  },
  lg: {
    height: 32,
    rowGap: 4,
    groupClass: 'gap-space-4',
    separatorMargin: 0,
    separatorMarginClass: 'my-0',
    icon: 20,
    gap: 8,
    rowClass: 'px-space-8 py-[5px] min-h-[32px] gap-space-8',
    gutter: 36,
  },
} as const;
export const ITEM_GEOMETRY = {
  xs: { height: 28, paddingHorizontal: 8, paddingVertical: 6, gap: 6, icon: 16 },
  sm: { height: 32, paddingHorizontal: 10, paddingVertical: 7, gap: 8, icon: 18 },
  md: { height: 36, paddingHorizontal: 12, paddingVertical: 8, gap: 8, icon: 20 },
  lg: { height: 44, paddingHorizontal: 16, paddingVertical: 11, gap: 12, icon: 24 },
} as const;

/** Toolbar spacing follows the app scale without changing its children's family proportions. */
export const TOOLBAR_GEOMETRY = {
  xs: { padding: 4, gap: 4, accessoryGap: 2 },
  sm: { padding: 6, gap: 6, accessoryGap: 4 },
  md: { padding: 8, gap: 8, accessoryGap: 4 },
  lg: { padding: 12, gap: 12, accessoryGap: 6 },
} as const;
