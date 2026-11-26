import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiDeleteBinLine, RiPencilLine, RiQuillPenLine, RiShareLine } from '@oxy.so/bloom/icons';

import {
  Button,
  HStack,
  Icon,
  Text,
  VStack,
  identity,
  regular,
  toElement,
  useNamespace,
} from '../index';
import { GlassGroup } from '../entries/glass-group';

/** Colour behind the glass, so the material shows. */
function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 24, gap: 24, minHeight: 520 }}>
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }} pointerEvents="none">
        {['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#9b5de5'].map((color) => (
          <View key={color} style={{ flex: 1, backgroundColor: color, opacity: 0.55 }} />
        ))}
      </View>
      {children}
    </View>
  );
}

function Glass() {
  const ns = useNamespace();
  const [erasing, setErasing] = useState(false);
  const [plain, setPlain] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <Backdrop>
      {toElement(
        VStack(
          // A glass group: one lens base on Android, UIKit's container on iOS, Surfaces on the web.
          GlassGroup(
            HStack(
              Button(Icon(RiPencilLine))
                .shape('circle')
                .label('Draw')
                .style('glass')
                .glassID('pencil', ns)
                .onPress(() => setErasing((on) => !on)),
              erasing
                ? Button(Icon(RiDeleteBinLine))
                    .shape('circle')
                    .label('Erase')
                    .style('glass')
                    .glassID('eraser', ns)
                : null,
            ).spacing('xl'),
          )
            .blend('xl')
            .animation('expand', erasing),
          // The glass button styles, and the environment that carries one.
          HStack(
            Button(Icon(RiShareLine)).shape('circle').label('Share').style('glass'),
            Button(Text('Done')).style('glassProminent'),
          ).spacing('md'),
          GlassGroup(
            HStack(
              Button(Text('Bold')),
              Button(Text('Italic')),
              Button(Text('Underline')),
            ).buttonStyle('glass'),
          ),
          // Identity and interactive glass.
          HStack(
            Button(Text(plain ? 'Glass off' : 'Glass on'))
              .style('plain')
              .onPress(() => setPlain((on) => !on)),
            VStack(Text('A bar that never springs'))
              .padding('md')
              .glass(plain ? identity : regular.interactive(false)),
          )
            .spacing('md')
            .align('center'),
          // disabled() reaches every control inside.
          VStack(
            Button(Text(saving ? 'Saving…' : 'Save')).onPress(() => setSaving((on) => !on)),
            HStack(
              Button(Icon(RiQuillPenLine)).shape('circle').label('Compose'),
              Button(Text('Cancel')).style('plain'),
            )
              .spacing('sm')
              .disabled(saving),
          ).spacing('sm'),
        ).spacing('2xl'),
      )}
    </Backdrop>
  );
}

const meta: Meta<typeof Glass> = {
  id: 'language-glass',
  title: 'Language/Glass',
  component: Glass,
};
export default meta;

/** Glass groups, the glass button styles, identity and interactive glass, and the environment. */
export const Web: StoryObj<typeof Glass> = {};
