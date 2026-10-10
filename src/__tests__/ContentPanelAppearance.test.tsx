import React from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ContentPanel as NativePanel } from '../content-panel/ContentPanel';
import { ContentPanel as WebPanel } from '../content-panel/ContentPanel.web';
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceLevelValue,
} from '../styles/surface-levels';
import { PageHeader } from '../page-header';
import { PageFooter } from '../page-footer';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolvedStyle, classNamesOn } from './support/rendered-style';

function Probe() {
  return <Text testID="surface-probe">{`${useSurfaceLevelValue()}:${useSurfaceFill()}`}</Text>;
}
const PaintComponent = (
  SurfacePaint as unknown as {
    type: React.ComponentType<React.ComponentProps<typeof SurfacePaint>>;
  }
).type;
const originalOS = Platform.OS;
afterEach(() => Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true }));

it.each([
  ['native', NativePanel],
  ['web', WebPanel],
] as const)(
  '%s plain panel preserves geometry and inherits actual parent paint for header and footer',
  (platform, Panel) => {
    Object.defineProperty(Platform, 'OS', {
      value: platform === 'web' ? 'web' : 'ios',
      configurable: true,
    });
    const view = render(
      <BloomThemeProvider mode="dark">
        <SurfaceLevelProvider level={2} fill="#203040">
          <Panel
            appearance="plain"
            framed
            fill
            overlaySizing="panel"
            surfaceColor="#ff0000"
            surfaceStyle={{ backgroundColor: '#ff0000' }}
          >
            <Probe />
            <PageHeader testID="header" title="Messages" safeArea={false} />
            <PageFooter testID="footer" safeArea={false} />
          </Panel>
        </SurfaceLevelProvider>
      </BloomThemeProvider>,
    );
    const surface = view.getByTestId('content-panel-surface');
    expect(resolvedStyle(surface.props.style)).toMatchObject({
      backgroundColor: 'transparent',
      borderRadius: 28,
    });
    expect(resolvedStyle(view.getByTestId('content-panel-content').props.style).borderRadius).toBe(
      28,
    );
    expect(classNamesOn(surface.props.style).join(' ')).not.toContain('bg-card');
    expect(resolvedStyle(surface.props.style).boxShadow).toBeUndefined();
    expect(surface.props.dataSet?.bloomPanelMaterial).toBeUndefined();
    expect(view.queryByTestId('content-panel-border-frame')).toBeNull();
    expect(view.UNSAFE_queryAllByType(PaintComponent)).toHaveLength(0);
    expect(view.getByTestId('surface-probe').props.children).toBe('2:#203040');
    for (const id of ['header-scrim-gradient', 'footer-scrim-gradient']) {
      const ramp = view.getByTestId(id).findByProps({ x1: '0', x2: '0' });
      expect(ramp.findAllByProps({ stopColor: '#203040' }).length).toBeGreaterThan(1);
    }
    if (platform === 'web') {
      expect(resolvedStyle(surface.props.style)['--bloom-surface']).toBe('#203040');
      expect(
        resolvedStyle(view.getByTestId('content-panel-bleed-mask').props.style).boxShadow,
      ).toContain('#203040');
    }
  },
);

it.each([NativePanel, WebPanel])(
  'switches appearance without remounting content and keeps solid default behavior',
  (Panel) => {
    let mounts = 0;
    function Child() {
      React.useEffect(() => {
        mounts += 1;
      }, []);
      return <Probe />;
    }
    const tree = (plain: boolean) => (
      <BloomThemeProvider mode="light">
        <SurfaceLevelProvider level={2} fill="#203040">
          <Panel appearance={plain ? 'plain' : 'solid'} framed chrome="none">
            <Child />
          </Panel>
        </SurfaceLevelProvider>
      </BloomThemeProvider>
    );
    const view = render(tree(false));
    expect(view.getByTestId('surface-probe').props.children).toMatch(/^1:/);
    expect(classNamesOn(view.getByTestId('content-panel-surface').props.style).join(' ')).toContain(
      'bg-card',
    );
    view.rerender(tree(true));
    expect(view.getByTestId('surface-probe').props.children).toBe('2:#203040');
    expect(mounts).toBe(1);
  },
);
