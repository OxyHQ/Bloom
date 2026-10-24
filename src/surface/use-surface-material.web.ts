import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  resolveSurfaceOptics,
  resolveSurfaceTint,
  SURFACE_VARS_OFF,
  surfaceOpticsVars,
} from './shared';
import { surfaceMaterialCss } from './web-material';

/**
 * Move a web host fill into the shared body and edge paint; preserve layout and shadow.
 * `radius` is the host's corner, for the edge light's falloff. With
 * `framing: 'responsive'` the edge light waits for the host's breakpoint classes
 * (`--bloom-framed-highlight-filter`), since below the breakpoint the host is square.
 */
export function useSurfaceMaterial(
  selector: string,
  id: string,
  fill: string,
  enabled = true,
  paintFill?: string,
  paintOptics?: ReturnType<typeof resolveSurfaceOptics>,
  radius?: unknown,
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
  return useMemo(() => {
    if (!enabled) return SURFACE_VARS_OFF;
    const { '--bloom-surface-highlight-filter': highlight, ...vars } = surfaceOpticsVars(
      optics,
      radius,
    );
    return {
      backgroundColor: 'transparent',
      '--bloom-surface-fill': paintFill ?? resolveSurfaceTint(fill),
      ...vars,
      ...(framing === 'responsive'
        ? { '--bloom-framed-highlight-filter': highlight }
        : { '--bloom-surface-highlight-filter': highlight }),
    };
  }, [optics, fill, paintFill, enabled, radius, framing]);
}
