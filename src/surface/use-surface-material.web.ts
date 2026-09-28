import { useSurfaceRefraction } from './web-refraction';
import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveSurfaceOptics, resolveSurfaceTint } from './shared';
import { surfaceMaterialCss } from './web-material';

/** Move a web host fill into the shared body and edge paint; preserve layout and shadow. */
export function useSurfaceMaterial(selector: string, id: string, fill: string): WebCssStyle {
  useSurfaceRefraction(true);
  const css = useMemo(() => `${selector} { isolation: isolate; }\n${surfaceMaterialCss(selector, 'var(--bloom-surface-fill)')}`, [selector]);
  useInteractiveWebCss(id, css);
  const theme = useContext(BloomThemeContext)?.theme;
  const optics = resolveSurfaceOptics(theme?.isDark ?? false);
  return useMemo(() => ({
    backgroundColor: 'transparent',
    '--bloom-surface-fill': resolveSurfaceTint(fill),
    '--bloom-surface-rim': optics.rim,
    '--bloom-surface-sheen': optics.sheenCss,
  }), [optics, fill]);
}
