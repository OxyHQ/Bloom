import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BottomEdgeProvider, useBottomEdgeInset } from './bottom-edge';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
import { RiAddLine, RiHomeLine, RiSearchLine } from '../icons';

function Footprint() {
  const occupied = useBottomEdgeInset();
  return <Text>Reserved bottom edge: {occupied}px (including the safe area once)</Text>;
}
function LayoutDemo({ inset = 24 }: { inset?: number }) {
  const [value, setValue] = useState('home');
  return <SafeAreaInsetsContext.Provider value={{top:0,right:0,bottom:inset,left:0}}>
    <BottomEdgeProvider><View style={{ maxWidth: '100%',height:480,width:360,justifyContent:'space-between'}}>
      <Footprint />
      <BottomBar items={[{name:'home',label:'Home',icon:<RiHomeLine />},{name:'search',label:'Search',icon:<RiSearchLine />}]} value={value} onValueChange={setValue} action={<Fab icon={RiAddLine} accessibilityLabel="Compose" />} />
    </View></BottomEdgeProvider>
  </SafeAreaInsetsContext.Provider>;
}
const meta = { title: 'Foundations/Layout', component: LayoutDemo, args: {inset:24}, argTypes: {inset:{control:{type:'range',min:0,max:48}}} } satisfies Meta<typeof LayoutDemo>;
export default meta;
type Story = StoryObj<typeof LayoutDemo>;
export const BottomEdge: Story = {};
