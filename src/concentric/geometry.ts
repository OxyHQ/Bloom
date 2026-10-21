import type { ViewStyle } from 'react-native';
import type { CornerRadii, SurfaceStyle } from '../shapes/corner-types';
import type { ConcentricCorners, ConcentricEdges, ConcentricGeometry } from './types';

export const SIDES = ['top', 'right', 'bottom', 'left'] as const;
export const CORNERS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
export const CORNER_SIDES = {
  topLeft: ['top', 'left'],
  topRight: ['top', 'right'],
  bottomRight: ['bottom', 'right'],
  bottomLeft: ['bottom', 'left'],
} as const;
export const EMPTY_GEOMETRY: ConcentricGeometry = {
  corners: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
  gap: { top: 0, right: 0, bottom: 0, left: 0 },
};
const finite = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);

/** Resolve RN logical/shorthand precedence before doing geometry; no class-name parsing. */
export function edgeValues(
  style: ViewStyle | undefined,
  kind: 'padding' | 'margin' | 'border',
  rtl = false,
): Partial<ConcentricEdges> {
  const s = (style ?? {}) as Record<string, unknown>;
  const suffix = kind === 'border' ? 'Width' : '';
  const value = (name: string) => finite(s[`${kind}${name}${suffix}`]);
  return {
    top: value('Top') ?? value('BlockStart') ?? value('Vertical') ?? value('Block') ?? value(''),
    bottom:
      value('Bottom') ?? value('BlockEnd') ?? value('Vertical') ?? value('Block') ?? value(''),
    left:
      value(rtl ? 'End' : 'Start') ??
      value(rtl ? 'InlineEnd' : 'InlineStart') ??
      value('Left') ??
      value('Horizontal') ??
      value('Inline') ??
      value(''),
    right:
      value(rtl ? 'Start' : 'End') ??
      value(rtl ? 'InlineStart' : 'InlineEnd') ??
      value('Right') ??
      value('Horizontal') ??
      value('Inline') ??
      value(''),
  };
}
export function cornerValues(value: number | CornerRadii): ConcentricCorners {
  return typeof value === 'number'
    ? { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value }
    : {
        topLeft: value.topStart ?? 0,
        topRight: value.topEnd ?? 0,
        bottomRight: value.bottomEnd ?? 0,
        bottomLeft: value.bottomStart ?? 0,
      };
}
export function styledCorners(style?: ViewStyle, rtl = false): ConcentricCorners | undefined {
  const s = (style ?? {}) as Record<string, unknown>;
  const uniform = finite(s.borderRadius);
  if (
    uniform === undefined &&
    !CORNERS.some((corner) => finite(s[`border${title(corner)}Radius`]) !== undefined) &&
    ![
      'TopStart',
      'TopEnd',
      'BottomStart',
      'BottomEnd',
      'StartStart',
      'StartEnd',
      'EndStart',
      'EndEnd',
    ].some((corner) => finite(s[`border${corner}Radius`]) !== undefined)
  )
    return undefined;
  return {
    topLeft:
      finite(s[rtl ? 'borderStartEndRadius' : 'borderStartStartRadius']) ??
      finite(s[rtl ? 'borderTopEndRadius' : 'borderTopStartRadius']) ??
      finite(s.borderTopLeftRadius) ??
      uniform ??
      0,
    topRight:
      finite(s[rtl ? 'borderStartStartRadius' : 'borderStartEndRadius']) ??
      finite(s[rtl ? 'borderTopStartRadius' : 'borderTopEndRadius']) ??
      finite(s.borderTopRightRadius) ??
      uniform ??
      0,
    bottomRight:
      finite(s[rtl ? 'borderEndStartRadius' : 'borderEndEndRadius']) ??
      finite(s[rtl ? 'borderBottomStartRadius' : 'borderBottomEndRadius']) ??
      finite(s.borderBottomRightRadius) ??
      uniform ??
      0,
    bottomLeft:
      finite(s[rtl ? 'borderEndEndRadius' : 'borderEndStartRadius']) ??
      finite(s[rtl ? 'borderBottomEndRadius' : 'borderBottomStartRadius']) ??
      finite(s.borderBottomLeftRadius) ??
      uniform ??
      0,
  };
}
/** Circular corners subtract the smaller adjacent gap and clamp at zero. */
export function resolveConcentricCorners(
  corners: ConcentricCorners,
  gap: ConcentricEdges,
): ConcentricCorners {
  return Object.fromEntries(
    CORNERS.map((corner) => {
      const [a, b] = CORNER_SIDES[corner];
      const radius = corners[corner];
      if (![radius, gap[a], gap[b]].every(Number.isFinite) || radius < 0)
        throw new RangeError('Concentric geometry requires finite lengths and non-negative radii.');
      return [corner, radius >= 9999 ? radius : Math.max(0, radius - Math.min(gap[a], gap[b]))];
    }),
  ) as unknown as ConcentricCorners;
}
export const cornersStyle = (corners: ConcentricCorners): SurfaceStyle => ({
  borderTopLeftRadius: corners.topLeft,
  borderTopRightRadius: corners.topRight,
  borderBottomRightRadius: corners.bottomRight,
  borderBottomLeftRadius: corners.bottomLeft,
});
export function logicalCorners(corners: ConcentricCorners, rtl: boolean): CornerRadii {
  return {
    topStart: rtl ? corners.topRight : corners.topLeft,
    topEnd: rtl ? corners.topLeft : corners.topRight,
    bottomStart: rtl ? corners.bottomRight : corners.bottomLeft,
    bottomEnd: rtl ? corners.bottomLeft : corners.bottomRight,
  };
}
