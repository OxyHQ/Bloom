import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button } from '../button/Button';
import { resolvedStyle } from './support/rendered-style';

// Exercise the actual native CSS compiler and resolver, not the default web
// $$css marker used by ordinary structural suites.
jest.mock('react-native', () => ({ ...jest.requireActual('../../__mocks__/react-native'), PlatformColor: (...names: string[]) => ({ semantic: names }) }));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () => jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'));

beforeEach(() => {
  StyleCollection.styles.clear();
  const css = compile(`
    .purchase { height: 52px; padding: 16px; border-radius: 24px; background-color: #5433eb; color: #ffffff; box-shadow: -.5px -.5px 1px #ffffff52 inset, 1px 1px .5px #ffffff52 inset, 0 4px 24px #5433eb3d; }
    .purchase-type { font-size: 16px; line-height: 20px; font-weight: 600; }
    .purchase-interactive:hover { background-color: #4524db; color: #eeeeee; }
    .purchase-interactive:active { background-color: #321abc; color: #dddddd; transform: scale(.99); }
    .offset-only { margin-left: 12px; }
    .purchase-disabled { background-color: #eef0f1; color: #888888; }
  `);
  StyleCollection.inject(css.stylesheet());
});

it('lets native classes own geometry, state paint, label, glyph and loading color', () => {
  const icon = ({ color }: { color: string }) => <View testID="icon" accessibilityLabel={color} />;
  const ui = (props: { disabled?: boolean; loading?: boolean } = {}) => <BloomThemeProvider mode="light"><Button material="flat" className={`purchase purchase-type ${props.disabled ? "purchase-disabled" : props.loading ? "" : "purchase-interactive"}`} testID="button" renderLeadingIcon={icon} {...props}>Purchase</Button></BloomThemeProvider>;
  const api = render(ui());
  const host = () => api.getByTestId('button');
  expect(resolvedStyle(host().props.style)).toMatchObject({ height: 52, borderRadius: 24, backgroundColor: '#5433eb' });
  expect(resolvedStyle(api.getByText('Purchase').props.style)).toMatchObject({ color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: 600 });
  const shadows = resolvedStyle(host().props.style).boxShadow as Array<{ inset?: boolean }>;
  expect(shadows).toHaveLength(3);
  expect(shadows.filter(shadow => shadow.inset)).toHaveLength(2);
  expect(api.getByTestId('icon').props.accessibilityLabel).toBe('#fff');
  fireEvent(host(), 'hoverIn');
  expect(resolvedStyle(host().props.style).backgroundColor).toBe('#4524db');
  expect(api.getByTestId('icon').props.accessibilityLabel).toBe('#eee');
  fireEvent(host(), 'pressIn');
  expect(resolvedStyle(host().props.style).backgroundColor).toBe('#321abc');
  expect(api.getByTestId('icon').props.accessibilityLabel).toBe('#ddd');
  expect((resolvedStyle(host().props.style).transform as Array<Record<string, number>>).flatMap(Object.values)).toContain(.99);
  act(() => api.rerender(ui({ loading: true })));
  expect(api.UNSAFE_getByType(ActivityIndicator).props.color).toBe('#fff');
  expect(resolvedStyle(host().props.style).backgroundColor).toBe('#5433eb');
  act(() => api.rerender(ui({ disabled: true })));
  expect(resolvedStyle(host().props.style).backgroundColor).toBe('#eef0f1');
  expect(api.getByTestId('icon').props.accessibilityLabel).toBe('#888');
});


it.each(['light', 'dark'] as const)('keeps unclaimed defaults and explicit styles in %s mode', mode => {
  const api = render(<BloomThemeProvider mode={mode}>
    <Button material="flat" testID="normal">Default</Button>
    <Button material="flat" className="offset-only" testID="offset">Offset</Button>
    <Button material="flat" className="purchase" style={{ height: 64 }} testID="explicit">Explicit</Button>
  </BloomThemeProvider>);
  const baseline = resolvedStyle(api.getByTestId('normal').props.style);
  const custom = resolvedStyle(api.getByTestId('offset').props.style);
  for (const key of ['height', 'paddingHorizontal', 'borderRadius', 'backgroundColor', 'borderColor'] as const) expect(custom[key]).toEqual(baseline[key]);
  expect(custom.marginLeft).toBe(12);
  expect(resolvedStyle(api.getByTestId('explicit').props.style).height).toBe(64);
});

it('retains native stateful content while class-driven loading changes', () => {
  let mounts = 0;
  function Stateful() {
    React.useEffect(() => { mounts++; }, []);
    return <View testID="stateful" />;
  }
  const ui = (loading: boolean) => <BloomThemeProvider><Button material="flat" className="purchase" loading={loading}><Stateful /></Button></BloomThemeProvider>;
  const api = render(ui(false));
  api.rerender(ui(true));
  api.rerender(ui(false));
  expect(api.getByTestId('stateful')).toBeTruthy();
  expect(mounts).toBe(1);
});
