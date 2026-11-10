import type { TextStyle } from 'react-native';

import { useBloomAppearance, type BloomSize } from '../appearance';
import {
  MENU_GEOMETRY,
  CONTROL_LABEL_TYPE,
  DESKTOP_MENU_GEOMETRY,
} from '../appearance/control-geometry';
import { useDesktopPlatform } from '../platform-surface/use-desktop-platform';
import { useTouchInput } from '../styles/pointer';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';
import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';

/** Geometry only. BloomScope remains the sole source of size; paint stays on Surface. */
export function useMenuDensity(size?: BloomSize) {
  const resolved = useBloomAppearance({ size }, { size: 'md', tone: 'neutral' });
  return resolveMenuDensity(resolved.size, useTouchInput(), useDesktopPlatform());
}

/** What `resolveMenuDensity` resolves: a menu's geometry, numbers and classes. */
export interface MenuDensity {
  readonly size: BloomSize;
  readonly touch: boolean;
  /** Drawn as a desktop platform's menu (`DESKTOP_MENU_GEOMETRY`). */
  readonly desktop: boolean;
  readonly height: number;
  readonly type: TypeScaleVariant;
  /** The row label's type. */
  readonly rowType: TextStyle;
  readonly panelPadding: number;
  /** The panel's corner. */
  readonly panelRadius: number;
  /** A row's corner inline, or null where `ROW_CLASS`'s `rounded-[10px]` draws it. */
  readonly rowRadius: number | null;
  readonly gap: number;
  /** Between a row's leading glyph, label and trailing slot: `rowClass`'s `gap-*`, as a number. */
  readonly itemGap: number;
  readonly separatorMargin: number;
  readonly leadingSize: number;
  readonly gutter: number;
  /** The check or radio mark's box in the gutter, and its distance from the row's edge. */
  readonly indicatorSize: number;
  readonly indicatorInset: number;
  /** The check glyph and the sub-menu chevron (`ROW_ICON_SIZE` off a desktop). */
  readonly glyphSize: number;
  /** The width a menu's panel never goes below (`MENU_WIDTH` off a desktop), unless the caller says. */
  readonly minWidth: number;
  readonly groupClass: string;
  readonly panelClass: string;
  readonly rowClass: string;
  readonly labelClass: string;
  readonly separatorClass: string;
}

/**
 * A menu's geometry for a size and an input. On a desktop PLATFORM
 * (`useDesktopPlatform()`: an OxyOS window or shell) every size takes the
 * desktop's one compact menu (`DESKTOP_MENU_GEOMETRY`): 22px rows of 13px body
 * text, a 5px panel padding and a 10px corner, as a desktop's menus are the same
 * whatever the window's scale. Off one, nothing here changes.
 */
export function resolveMenuDensity(
  size: BloomSize,
  touch: boolean,
  desktop: boolean = false,
): MenuDensity {
  if (desktop) return resolveDesktopMenuDensity(size);
  const geometry = MENU_GEOMETRY[size];
  const type = CONTROL_LABEL_TYPE[size];
  return {
    size,
    touch,
    desktop: false,
    height: Math.max(touch ? 44 : 0, geometry.height),
    type,
    rowType: TYPE_SCALE[type],
    panelPadding: touch ? 8 : 6,
    panelRadius: 16,
    rowRadius: null,
    gap: geometry.rowGap,
    itemGap: geometry.gap,
    separatorMargin: geometry.separatorMargin,
    leadingSize: geometry.icon,
    gutter: geometry.gutter,
    indicatorSize: geometry.icon,
    indicatorInset: 8,
    glyphSize: 16,
    minWidth: 266,
    groupClass: geometry.groupClass,
    panelClass: touch ? 'p-space-8' : 'p-[6px]',
    rowClass: `${geometry.rowClass}${touch ? ' min-h-[44px]' : ''}`,
    labelClass: 'px-space-8 py-space-4',
    separatorClass: `${touch ? '-mx-space-8' : '-mx-[6px]'} ${geometry.separatorMarginClass} h-px`,
  };
}

function resolveDesktopMenuDensity(size: BloomSize): MenuDensity {
  const g = DESKTOP_MENU_GEOMETRY;
  return {
    size,
    touch: false,
    desktop: true,
    height: g.height,
    type: 'body-regular',
    rowType: DESKTOP_TEXT_STYLES.body,
    panelPadding: g.panelPadding,
    panelRadius: g.panelRadius,
    rowRadius: g.rowRadius,
    gap: g.rowGap,
    itemGap: g.gap,
    separatorMargin: g.separatorMargin,
    leadingSize: g.icon,
    gutter: g.gutter,
    indicatorSize: g.indicator,
    indicatorInset: g.indicatorInset,
    glyphSize: g.indicator,
    minWidth: g.minWidth,
    groupClass: g.groupClass,
    panelClass: g.panelClass,
    rowClass: g.rowClass,
    labelClass: g.labelClass,
    separatorClass: g.separatorClass,
  };
}
