import { render } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import { AppShell } from '../app-shell';
import { shellLayoutCss } from '../app-shell/shell-layout-css';
import { useSidebarMetrics } from '../sidebar/metrics';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

const items = [{ key: 'home', label: 'Home', icon: () => null }];

afterEach(() => jest.restoreAllMocks());

it.each(['dashboard', 'feed', 'canvas'] as const)(
  'keeps the %s rail flush without removing content framing',
  (variant) => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    mockWindowSize({ width: 900, height: 800, scale: 1, fontScale: 1 });
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <AppShell
          testID="shell"
          variant={variant}
          gutter={16}
          navFrom={0}
          scroll="fixed"
          sidebar={{ variant: 'rail', items }}
        >
          <Text>Content</Text>
        </AppShell>
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(tree.getByTestId('shell').props.style)).toMatchObject({
      paddingTop: 0,
      paddingBottom: 0,
      paddingInlineStart: 0,
      paddingInlineEnd: variant === 'canvas' ? 0 : 16,
      gap: 0,
    });
    expect(resolvedStyle(tree.getByTestId('shell-navigation').props.style).paddingTop ?? 0).toBe(0);
    expect(tree.getByText('Content')).toBeTruthy();
  },
);

it('does not apply the expanded sidebar inset to the adaptive rail', () => {
  mockWindowSize({ width: 900, height: 800, scale: 1, fontScale: 1 });
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <AppShell testID="shell" scroll="auto" navigationPlacement="rail" sidebar={{ items }} />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('shell-navigation-rail').props.style)).toMatchObject({
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  });
  expect(resolvedStyle(tree.getByTestId('shell-content').props.style)).toMatchObject({
    paddingInlineStart: 0,
    paddingInlineEnd: 16,
    paddingVertical: 16,
  });
});

it('compiles flush rail geometry while retaining the normal panel frame and expanded sidebar', () => {
  let css = '';
  function Probe() {
    const metrics = useSidebarMetrics();
    css = shellLayoutCss('rail', {
      sidebar: { items },
      panels: true,
      variant: 'feed',
      navigationAlign: 'content',
      metrics,
      layout: { panels: [{ id: 'page' }] },
      gap: 16,
      gutter: 16,
      navigationGap: 16,
      contentWidth: 600,
      userCollapsed: false,
    });
    return null;
  }
  render(
    <BloomThemeProvider fonts={false}>
      <Probe />
    </BloomThemeProvider>,
  );
  const rail = css.match(/--bloom-nav-mode:rail;[^}]+/)?.[0];
  const panel = css.match(/--bloom-nav-mode:panel;[^}]+/)?.[0];
  expect(rail).toContain('--bloom-frame-top:0px;--bloom-frame-bottom:0px;--bloom-frame-start:0px');
  expect(rail).toContain('--bloom-frame-end:16px');
  expect(rail).toContain('--bloom-nav-gap:0px');
  expect(rail).toContain('--bloom-body-gutter-top:16px;--bloom-body-gutter-bottom:16px');
  expect(rail).toContain('--bloom-frame-alignment:var(--bloom-frame-start)');
  expect(panel).toContain(
    '--bloom-frame-top:16px;--bloom-frame-bottom:16px;--bloom-frame-start:16px',
  );
  expect(panel).toContain('--bloom-nav-gap:16px');
});
