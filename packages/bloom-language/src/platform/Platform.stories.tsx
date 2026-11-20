import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiHome5Line,
  RiLinkM,
  RiMoreFill,
  RiNotification3Line,
  RiQuillPenLine,
  RiSearchLine,
  RiShareLine,
} from '@oxy.so/bloom/icons';

import {
  BottomBar,
  Button,
  Divider,
  FAB,
  Header,
  HStack,
  Icon,
  Item,
  Menu,
  Section,
  Submenu,
  Tab,
  Text,
  VStack,
  clear,
  regular,
  toElement,
} from '../index';

/** Colour behind the controls, so the web's frosted material shows. */
function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 24, gap: 24, minHeight: 640 }}>
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }} pointerEvents="none">
        {['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#9b5de5'].map((color) => (
          <View key={color} style={{ flex: 1, backgroundColor: color, opacity: 0.55 }} />
        ))}
      </View>
      {children}
    </View>
  );
}

function Components() {
  const [pinned, setPinned] = useState(false);
  const [tab, setTab] = useState('home');
  const postMenu = Menu(
    Button(Icon(RiMoreFill)).style('plain').tint('neutral').shape('circle').label('More'),
    Item('Copy link').icon(RiLinkM),
    Item('Pin to profile')
      .checked(pinned)
      .onPress(() => setPinned((v) => !v)),
    Submenu('Share', Item('Copy link'), Item('Share to…')).icon(RiShareLine),
    Divider(),
    Section(Item('Delete').icon(RiDeleteBinLine).destructive()).title('Danger'),
  ).label('Post options');
  return (
    <Backdrop>
      {toElement(
        VStack(
          Header('Notifications')
            .toolbar(
              Button(Icon(RiSearchLine))
                .style('subtle')
                .tint('neutral')
                .shape('circle')
                .label('Search'),
              postMenu,
            )
            .onBack(null),
          HStack(
            Button(Text('Solid')),
            Button(Text('Subtle')).style('subtle'),
            Button(Text('Outline')).style('outline'),
            Button(Text('Plain')).style('plain'),
            Button(Text('Danger')).tint('danger'),
            Button(Text('Loading')).loading(),
            Button(Text('Disabled')).disabled(),
          )
            .spacing('sm')
            .align('center'),
          HStack(
            Button(Icon(RiAddLine)).shape('circle').glass().label('Add'),
            Button(Icon(RiShareLine))
              .shape('circle')
              .style('plain')
              .tint('neutral')
              .glass()
              .label('Share'),
            Button(Icon(RiQuillPenLine))
              .shape('circle')
              .glass(clear.tint('primary', 'subtle'))
              .label('Compose'),
            Button(Text('On regular glass')).style('plain').tint('neutral').glass(regular),
            FAB(Icon(RiQuillPenLine)).label('Compose'),
            FAB(Icon(RiQuillPenLine), Text('Compose')),
            postMenu,
          )
            .spacing('md')
            .align('center'),
          BottomBar(
            Tab('Home', RiHome5Line).id('home'),
            Tab('Search', RiSearchLine).id('search'),
            Tab('Notifications', RiNotification3Line).id('notifications').badge(3),
          )
            .selection(tab)
            .onSelect(setTab)
            .action(FAB(Icon(RiQuillPenLine)).label('Compose')),
        ).spacing('2xl'),
      )}
    </Backdrop>
  );
}

const meta: Meta<typeof Components> = {
  id: 'language-platform',
  title: 'Language/Platform components',
  component: Components,
};
export default meta;

/** Menu, Button, Header, BottomBar and FAB as the web draws them: Bloom's frosted material, no glass. */
export const Web: StoryObj<typeof Components> = {};
