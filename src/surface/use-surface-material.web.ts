import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  resolveSurfaceOptics,
  resolveSurfaceTint,
  SURFACE_VARS_OFF,
  surfaceContrastEdge,
  surfaceOpticsVars,
} from './shared';
import { resolveSurfaceMaterial } from './resolve-surface-material';
import { SURFACE_HAIRLINE_VAR, surfaceMaterialCss } from './web-material';

/**
 * Move a web host fill into the shared body and edge paint; preserve layout and shadow.
 * With `framing: 'responsive'` the lighting waits for the host's breakpoint
 * classes (`--bloom-framed-lighting`), since below the breakpoint the host is square.
 */
export function useSurfaceMaterial(
  selector: string,
  id: string,
  fill: string,
  enabled = true,
  paintFill?: string,
  paintOptics?: ReturnType<typeof resolveSurfaceOptics>,
  framing: 'always' | 'responsive' = 'always',
): WebCssStyle {
  const css = useMemo(
    () =>
      `${selector} { isolation: isolate; }\n${surfaceMaterialCss(selector, 'var(--bloom-surface-fill)')}`,
    [selector],
  );
  useInteractiveWebCss(id, css);
  const theme = useContext(BloomThemeContext)?.theme;
  const optics = paintOptics ?? resolveSurfaceOptics(theme?.isDark ?? false);
  const text = theme?.colors.text;
  const backing = useSurfaceFill();
  return useMemo(() => {
    if (!enabled) return SURFACE_VARS_OFF;
    const { '--bloom-surface-lighting': lighting, ...vars } = surfaceOpticsVars(optics);
    const tint = paintFill ?? resolveSurfaceTint(fill);
    const solid = resolveSurfaceMaterial({ fill: tint, parentFill: backing }).solidFill;
    return {
      backgroundColor: 'transparent',
      '--bloom-surface-fill': tint,
      '--bloom-surface-solid': solid,
      [SURFACE_HAIRLINE_VAR]: text ? surfaceContrastEdge(solid, text) : 'transparent',
      ...vars,
      ...(framing === 'responsive'
        ? { '--bloom-framed-lighting': lighting }
        : { '--bloom-surface-lighting': lighting }),
    };
  }, [optics, fill, paintFill, enabled, framing, backing, text]);
}
