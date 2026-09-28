import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveSurfaceOptics } from './shared';
import { surfaceMaterialCss } from './web-material';

/** Decorate an existing web host; preserve its fill, radius, layout and shadow. */
export function useSurfaceMaterial(selector: string, id: string): WebCssStyle {
  const css = useMemo(() => `${selector} { isolation: isolate; }\n${surfaceMaterialCss(selector, 'transparent')}`, [selector]);
  useInteractiveWebCss(id, css);
  const theme = useContext(BloomThemeContext)?.theme;
  const optics = resolveSurfaceOptics(theme?.isDark ?? false);
  return useMemo(() => ({
    '--bloom-surface-rim': optics.rim,
    '--bloom-surface-sheen': optics.sheenCss,
  }), [optics]);
}
