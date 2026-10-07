import React from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { Sidebar } from '../sidebar';
import { ContentPanel as NativePanel } from '../content-panel/ContentPanel';
import { ContentPanel as WebPanel } from '../content-panel/ContentPanel.web';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolvedStyle, classNamesOn } from './support/rendered-style';

function Provider({ children }: React.PropsWithChildren) {
  return <BloomThemeProvider mode="light" colorPreset="teal">
    <SurfaceLevelProvider level={0} fill="#ffffff">{children}</SurfaceLevelProvider>
  </BloomThemeProvider>;
}

const PaintComponent = (SurfacePaint as unknown as { type: React.ComponentType<React.ComponentProps<typeof SurfacePaint>> }).type;
const originalOS = Platform.OS;
afterEach(() => Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true }));

it.each([undefined, 0, 12.5, 40])('shares radius %s across card sidebar, native panel paint and clip, and web masks', panelRadius => {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  const expected = panelRadius ?? 28;
  const sidebar = render(<Provider><BloomScope panelRadius={panelRadius}><Sidebar testID="sidebar" items={[]} /></BloomScope></Provider>);
  expect(resolvedStyle(sidebar.getByTestId('sidebar').props.style)).toMatchObject({ borderRadius: expected, borderCurve: 'continuous' });
  expect(sidebar.UNSAFE_getByType(PaintComponent).props.radius).toBe(expected);
  sidebar.unmount();
  const native = render(<Provider><BloomScope panelRadius={panelRadius}><NativePanel framed><Text>Content</Text></NativePanel></BloomScope></Provider>);
  for (const id of ['content-panel-surface', 'content-panel-content']) {
    expect(resolvedStyle(native.getByTestId(id).props.style)).toMatchObject({ borderRadius: expected, borderCurve: 'continuous' });
  }
  expect(native.UNSAFE_getByType(PaintComponent).props).toMatchObject({ radius: expected, shape: { curve: 'smooth' } });
  native.unmount();
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  const web = render(<Provider><BloomScope panelRadius={panelRadius}><WebPanel framed><Text>Content</Text></WebPanel></BloomScope></Provider>);
  for (const id of ['content-panel-surface', 'content-panel-content', 'content-panel-bleed-mask', 'content-panel-border-frame']) {
    expect(resolvedStyle(web.getByTestId(id).props.style)).toMatchObject({ borderRadius: expected, cornerShape: 'squircle' });
    expect(classNamesOn(web.getByTestId(id).props.style).join(' ')).not.toContain('radius-28');
  }
});

it('inherits the panel setting across control scopes, overrides it locally, and updates it', () => {
  const tree = (radius: number) => <Provider><BloomScope panelRadius={radius}>
    <BloomScope size="sm"><Sidebar testID="inherited" items={[]} /></BloomScope>
    <BloomScope panelRadius={0}><Sidebar testID="override" items={[]} /></BloomScope>
  </BloomScope></Provider>;
  const view = render(tree(16));
  expect(resolvedStyle(view.getByTestId('inherited').props.style).borderRadius).toBe(16);
  expect(resolvedStyle(view.getByTestId('override').props.style).borderRadius).toBe(0);
  view.rerender(tree(32));
  expect(resolvedStyle(view.getByTestId('inherited').props.style).borderRadius).toBe(32);
  expect(resolvedStyle(view.getByTestId('override').props.style).borderRadius).toBe(0);
});

it.each([NativePanel, WebPanel])('keeps unframed panels square and chrome=none free of material edges', Panel => {
  const view = render(<Provider><BloomScope panelRadius={40}><Panel framed={false}><Text>Plain</Text></Panel></BloomScope></Provider>);
  for (const id of ['content-panel-surface', 'content-panel-content']) {
    expect(resolvedStyle(view.getByTestId(id).props.style).borderRadius).toBe(0);
  }
  view.rerender(<Provider><BloomScope panelRadius={40}><Panel framed chrome="none"><Text>Reader</Text></Panel></BloomScope></Provider>);
  expect(resolvedStyle(view.getByTestId('content-panel-content').props.style).borderRadius).toBe(40);
  const surface = view.getByTestId('content-panel-surface');
  expect(resolvedStyle(surface.props.style).boxShadow).toBeUndefined();
  expect(classNamesOn(surface.props.style).join(' ')).not.toContain('border');
  expect(surface.props.dataSet?.bloomPanelMaterial).toBeUndefined();
  expect(view.UNSAFE_queryAllByType(PaintComponent)).toHaveLength(0);
  expect(view.queryByTestId('content-panel-border-frame')).toBeNull();
});

it('keeps the configured web radius responsive through every framing breakpoint', () => {
  for (const [framedFrom, prefix] of [[500, 'min-[500px]'], [640, 'sm'], [768, 'md'], [1024, 'lg']] as const) {
    const view = render(<Provider><BloomScope panelRadius={18}><WebPanel framedFrom={framedFrom}><Text>Responsive</Text></WebPanel></BloomScope></Provider>);
    expect(resolvedStyle(view.getByTestId('content-panel-surface').props.style)['--bloom-panel-radius']).toBe('18px');
    for (const id of ['content-panel-surface', 'content-panel-content']) {
      expect(classNamesOn(view.getByTestId(id).props.style).join(' ')).toContain(`${prefix}:rounded-[var(--bloom-panel-radius)]`);
    }
    view.unmount();
  }
});

it.each([-1, NaN, Infinity])('rejects invalid panel radius %s at the scope boundary', panelRadius => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<BloomScope panelRadius={panelRadius}><Text>Invalid</Text></BloomScope>)).toThrow('panelRadius must be a finite, non-negative number');
  error.mockRestore();
});
