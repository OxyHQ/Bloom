import { useBloomAppearance, type BloomSize } from '../appearance';
import { MENU_GEOMETRY, CONTROL_LABEL_TYPE } from '../appearance/control-geometry';
import { useTouchInput } from '../styles/pointer';

/** Geometry only. BloomScope remains the sole source of size; paint stays on Surface. */
export function useMenuDensity(size?: BloomSize) {
  const resolved = useBloomAppearance({ size }, { size: 'md', tone: 'neutral' });
  return resolveMenuDensity(resolved.size, useTouchInput());
}
export function resolveMenuDensity(size: BloomSize, touch: boolean) {
  const geometry = MENU_GEOMETRY[size];
  return {
    size,
    touch,
    height: Math.max(touch ? 44 : 0, geometry.height),
    type: CONTROL_LABEL_TYPE[size],
    panelPadding: touch ? 8 : 6,
    gap: 0,
    leadingSize: geometry.icon,
    gutter: geometry.gutter,
    groupClass: 'gap-0',
    panelClass: touch ? 'p-space-8 gap-0' : 'p-[6px] gap-0',
    rowClass: `${geometry.rowClass}${touch ? ' min-h-[44px]' : ''}`,
    labelClass: 'px-space-8 py-space-4',
    separatorClass: touch ? '-mx-space-8 my-space-4 h-px' : '-mx-[6px] my-space-4 h-px',
  } as const;
}
