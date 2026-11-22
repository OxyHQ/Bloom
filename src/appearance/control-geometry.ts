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
    separatorMargin: 3,
    icon: 16,
    gap: 6,
    gutter: 30,
  },
  sm: {
    height: 26,
    rowGap: 2,
    separatorMargin: 2,
    icon: 18,
    gap: 6,
    gutter: 32,
  },
  md: {
    height: 28,
    rowGap: 2,
    separatorMargin: 2,
    icon: 20,
    gap: 8,
    gutter: 36,
  },
  lg: {
    height: 32,
    rowGap: 4,
    separatorMargin: 0,
    icon: 20,
    gap: 8,
    gutter: 36,
  },
} as const;
/**
 * A desktop PLATFORM's menu (`useDesktopPlatform()`), the same at every size:
 * a desktop's menus are compact and identical in every window. A 13/16 body
 * line in a 22px row (3px above and below), 8px from the row's edges; rows
 * touch, with 5px of panel round them and a 10px panel corner concentric with
 * the rows' 5px. Separators are inset 5px from the panel's padding (10 from its
 * edge) with 5px above and below. A check or radio mark sits in a 20px gutter,
 * its 12px glyph sized to the text. The panel is as wide as its widest row,
 * never below 120px.
 */
export const DESKTOP_MENU_GEOMETRY = {
  height: 22,
  rowGap: 0,
  separatorMargin: 5,
  icon: 16,
  gap: 6,
  gutter: 20,
  indicator: 12,
  indicatorInset: 5,
  panelPadding: 5,
  panelRadius: 10,
  rowRadius: 5,
  minWidth: 120,
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
