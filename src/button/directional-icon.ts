import type { ViewStyle } from 'react-native';
import type { Direction } from '../direction/types';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightLine } from '../icons/remix/RiArrowRightLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiSidebarFoldLine } from '../icons/remix/RiSidebarFoldLine';
import { RiSidebarUnfoldLine } from '../icons/remix/RiSidebarUnfoldLine';

/** Only navigation glyphs mirror. Media controls, branding and trend arrows retain their meaning. */
const DIRECTIONAL_ICONS = new Set<unknown>([RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine, RiSidebarFoldLine, RiSidebarUnfoldLine]);
export function isDirectionalIcon(icon: unknown, direction: Direction): boolean {
  return direction === 'rtl' && DIRECTIONAL_ICONS.has(icon);
}
export function directionalIconStyle(icon: unknown, direction: Direction): ViewStyle | undefined {
  return isDirectionalIcon(icon, direction) ? { transform: [{ rotate: '180deg' }] } : undefined;
}
