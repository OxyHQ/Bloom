/**
 * Where a sidebar starts is decided in two places that must agree: the engine (native, and the
 * web's inline styles) and the web's CSS layout. Both ask `plainNavFlushes`, so a plain sidebar
 * beside a panel region is flush to the window in the CSS the browser uses too, not only in the
 * inline styles, which the CSS overrides.
 */
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { shellLayoutCss } from '../app-shell/shell-layout-css';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useSidebarMetrics } from '../sidebar/metrics';

const NAV = [{ key: 'home', label: 'Home', icon: () => null }];

function compile(surface: 'plain' | 'card', extra: { navigationAlign?: 'content' } = {}) {
  let css = '';
  const Probe = () => {
    const metrics = useSidebarMetrics();
    css = shellLayoutCss('s', {
      sidebar: { items: NAV, surface, variant: 'panel', collapsed: false },
      navFrom: 'lg',
      panels: true,
      variant: 'dashboard',
      ...extra,
      metrics: { ...metrics, expanded: 260 },
      layout: { panels: [{ id: 'page' }] },
      gap: 12,
      gutter: 12,
      navigationGap: 12,
      contentWidth: 1100,
      userCollapsed: false,
      fillWidth: true,
    } as never);
    return <Text>probe</Text>;
  };
  render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Probe />
    </BloomThemeProvider>,
  );
  return css;
}

describe('the CSS layout of a shell with a panel region', () => {
  it('runs a plain sidebar flush: no frame padding at its start, top or bottom, the gutter on the body', () => {
    const css = compile('plain');
    // Wide enough for the sidebar to be in flow (lg): the range's variables.
    expect(css).toContain('--bloom-frame-top:0px;--bloom-frame-bottom:0px;--bloom-frame-start:0px');
    expect(css).toContain('--bloom-body-gutter-top:12px;--bloom-body-gutter-bottom:12px');
  });

  it('keeps the frame’s gutter around a card sidebar', () => {
    const css = compile('card');
    expect(css).toContain(
      '--bloom-frame-top:12px;--bloom-frame-bottom:12px;--bloom-frame-start:12px',
    );
    expect(css).toContain('--bloom-body-gutter-top:0px;--bloom-body-gutter-bottom:0px');
  });
});
