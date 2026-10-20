import { useBloomAppearance } from '../appearance';
import type { TooltipSize } from './constants';

/** Preserve the two tooltip recipes; clamp inherited xs/lg to the nearest supported rung. */
export function useTooltipSize(own?: TooltipSize): TooltipSize {
  const { size } = useBloomAppearance({ size: own }, { size: 'sm', tone: 'neutral' });
  return size === 'xs' ? 'sm' : size === 'lg' ? 'md' : size;
}
