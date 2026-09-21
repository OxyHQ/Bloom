import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppShellBottomBar } from '../app-shell/AppShellBars';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout/bottom-edge';
import { resolvedStyle } from './support/rendered-style';

function Reader() { return <Text testID="inset">{useBottomEdgeInset()}</Text>; }
function OtherClaim({height}: {height:number}) { useClaimBottomEdge(height); return null; }
const safeArea = {top:0,left:0,right:0,bottom:20};
function layout(tree: ReturnType<typeof render>, height:number) {
  fireEvent(tree.getByTestId('bar'), 'layout', {nativeEvent:{layout:{height,width:390,x:0,y:0}}});
}
it('claims the measured wrapper including safe-area exactly once and ignores equal measurements', () => {
  const onHeightChange = jest.fn();
  const tree = render(<BottomEdgeProvider><SafeAreaInsetsContext.Provider value={safeArea}><AppShellBottomBar doc={false} testID="bar" onHeightChange={onHeightChange}><Text>Embedded tabs</Text></AppShellBottomBar><Reader/></SafeAreaInsetsContext.Provider></BottomEdgeProvider>);
  expect(resolvedStyle(tree.getByTestId('bar').props.style).paddingBottom).toBe(20);
  expect(tree.getByTestId('inset').props.children).toBe(0);
  layout(tree,78);
  expect(tree.getByTestId('inset').props.children).toBe(78);
  layout(tree,78.2);
  expect(onHeightChange).toHaveBeenCalledTimes(1);
  layout(tree,92);
  expect(tree.getByTestId('inset').props.children).toBe(92);
  expect(onHeightChange).toHaveBeenLastCalledWith(92);
});
it('combines overlapping claims by maximum and releases only its own on unmount', () => {
  const callback = jest.fn();
  const ui = (show:boolean) => <BottomEdgeProvider><OtherClaim height={40}/>{show && <AppShellBottomBar doc testID="bar" onHeightChange={callback}><Text>Tabs</Text></AppShellBottomBar>}<Reader/></BottomEdgeProvider>;
  const tree = render(ui(true));
  layout(tree,80);
  expect(tree.getByTestId('inset').props.children).toBe(80);
  tree.rerender(ui(false));
  expect(tree.getByTestId('inset').props.children).toBe(40);
});
it('remains usable without a bottom-edge provider', () => {
  const callback = jest.fn();
  const tree = render(<AppShellBottomBar doc={false} testID="bar" onHeightChange={callback}><Text>Tabs</Text></AppShellBottomBar>);
  layout(tree,58);
  expect(callback).toHaveBeenCalledWith(58);
});
