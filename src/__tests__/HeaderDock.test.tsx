import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { HeaderDockProvider, StickySection, useTopEdgeInset, useHeaderDockInset } from '../layout';
import { useHeaderDockContext } from '../layout/header-dock';
import { PageHeader } from '../page-header';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { resolvedStyle } from './support/rendered-style';

function Probe() { const dock=useHeaderDockContext()!; return <View><Text testID="height">{useTopEdgeInset()}</Text><Text testID="list-inset">{useHeaderDockInset()}</Text><Text testID="progress">{dock.progress.value}</Text></View>; }
const position = {value:0} as SharedValue<number>;
function frame(placement: 'inline'|'overlap' = 'overlap', section=true) {
  return <BloomThemeProvider fonts={false}><SurfaceLevelProvider level={1} fill="#456789"><HeaderDockProvider scrollY={position}>
    <PageHeader testID="header" title={<Text>Profile</Text>} placement={placement} scrim="always" titleReveal="onDock" />
    {section && <StickySection testID="tabs" offset={300}><Text>Posts</Text></StickySection>}
    <Probe/>
  </HeaderDockProvider></SurfaceLevelProvider></BloomThemeProvider>;
}
afterEach(()=>{position.value=0;});
it('withdraws measured header height from flow and publishes it for native list offsets', () => {
  const tree=render(frame());
  fireEvent(tree.getByTestId('header'),'layout',{nativeEvent:{layout:{height:88,width:390,x:0,y:0}}});
  expect(resolvedStyle(tree.getByTestId('header').props.style).marginBottom).toBe(-88);
  expect(tree.getByTestId('height').props.children).toBe(88);
  expect(tree.getByTestId('list-inset').props.children).toBe(88);
  expect(resolvedStyle(tree.getByTestId('tabs').props.style).transform).toBeUndefined();
  expect(resolvedStyle(tree.getByTestId('tabs').props.style).position).toBeUndefined();
});
it('shares the exact surface paint and becomes opaque when the native overlay section docks', () => {
  const tree=render(frame());
  expect(tree.getByTestId('header-title-block', { includeHiddenElements: true }).props['aria-hidden']).toBe(true);
  position.value=300;
  tree.rerender(frame());
  tree.rerender(frame());
  expect(tree.getByTestId('progress').props.children).toBe(1);
  const paint=resolvedStyle(tree.getByTestId('header-docked-fill').props.style);
  expect(paint).toMatchObject({backgroundColor:'#456789',opacity:1});
  expect(tree.getByTestId('header-title-block').props['aria-hidden']).toBe(false);
  expect(resolvedStyle(tree.getByTestId('tabs').props.style).backgroundColor).toBe(paint.backgroundColor);
  expect(resolvedStyle(tree.getByTestId('header-scrim').props.style).opacity).toBe(0);
  position.value=0;
  tree.rerender(frame());
  tree.rerender(frame());
  expect(resolvedStyle(tree.getByTestId('header-docked-fill').props.style).opacity).toBe(0);
});
it('publishes inline header geometry but leaves its normal flow space intact', () => {
  const tree=render(frame('inline'));
  fireEvent(tree.getByTestId('header'),'layout',{nativeEvent:{layout:{height:72,width:390,x:0,y:0}}});
  expect(tree.getByTestId('height').props.children).toBe(72);
  expect(tree.getByTestId('list-inset').props.children).toBe(0);
  expect(resolvedStyle(tree.getByTestId('header').props.style).marginBottom).toBeUndefined();
  position.value=230;
  tree.rerender(frame('inline'));
  expect(tree.getByTestId('progress').props.children).toBe(0);
});
it('clears the dock target when the section unmounts', () => {
  const tree=render(frame());
  position.value=500;
  tree.rerender(frame());
  tree.rerender(frame());
  expect(tree.getByTestId('progress').props.children).toBe(1);
  tree.rerender(frame('overlap',false));
  tree.rerender(frame('overlap',false));
  expect(tree.getByTestId('progress').props.children).toBe(0);
});

it('updates native list clearance when placement changes without a height change', () => {
  const tree = render(frame('inline'));
  expect(tree.getByTestId('list-inset').props.children).toBe(0);
  tree.rerender(frame('overlap'));
  expect(tree.getByTestId('list-inset').props.children).toBeGreaterThan(0);
  tree.rerender(frame('inline'));
  expect(tree.getByTestId('list-inset').props.children).toBe(0);
});
