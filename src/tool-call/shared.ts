import type { TypeScaleVariant } from '../typography/scale';
import type { ToolCallSize } from './types';

/**
 * `ToolCall`'s rungs, pure so a gate can walk them without rendering.
 *
 *          padding-y  padding-x  gap  icon  title              secondary
 *   sm     4          8          8    14    body-2-medium      caption-1-regular
 *   md     8          10         10   16    body-medium        body-2-regular
 *   lg     10         12         12   18    headline-medium    body-regular
 */
export interface ToolCallGeometry {
  paddingVertical: number;
  paddingHorizontal: number;
  gap: number;
  icon: number;
  title: TypeScaleVariant;
  secondary: TypeScaleVariant;
}

export const TOOL_CALL_GEOMETRY: Readonly<Record<ToolCallSize, ToolCallGeometry>> = {
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 8,
    icon: 14,
    title: 'body-2-medium',
    secondary: 'caption-1-regular',
  },
  md: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
    icon: 16,
    title: 'body-medium',
    secondary: 'body-2-regular',
  },
  lg: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    icon: 18,
    title: 'headline-medium',
    secondary: 'body-regular',
  },
};

/** `420ms` under a second, `2.4s` above. Units are symbols, so they are not translated. */
export function formatDuration(durationMs: number): string {
  return durationMs < 1000 ? `${Math.round(durationMs)}ms` : `${(durationMs / 1000).toFixed(1)}s`;
}
