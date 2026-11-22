import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiHeart3Line, RiShareLine, RiStarLine } from '@oxy.so/bloom/icons';

import {
  Button,
  ConfirmationDialog,
  defineKeyframes,
  Header,
  HStack,
  Icon,
  Item,
  ScrollArea,
  Text,
  ToolbarGroup,
  ToolbarSpacer,
  toElement,
  ViewThatFits,
  VStack,
} from '../index';

const bounce = defineKeyframes({
  y: [
    { to: '-lg', motion: 'pop' },
    { to: 'none', motion: 'select' },
  ],
  scale: [
    { to: 1.2, ms: 120 },
    { to: 1, ms: 180 },
  ],
});

/** What the language took from SwiftUI beside the glass: dialogs, toolbars, insets, phases, fitting. */
function Adoptions() {
  const [asking, setAsking] = useState(false);
  const [likes, setLikes] = useState(0);
  const [stars, setStars] = useState(0);
  return (
    <View style={{ padding: 24, gap: 24, minHeight: 640 }}>
      {toElement(
        VStack(
          Header('Landmark').toolbar(
            ToolbarGroup(Button(Icon(RiShareLine)).shape('circle').label('Share')),
            ToolbarSpacer('fixed'),
            ToolbarGroup(
              Button(Icon(RiHeart3Line)).shape('circle').label('Favorite'),
              Button(Icon(RiStarLine)).shape('circle').label('Collect'),
            ),
            ToolbarSpacer('fixed'),
            Button(Text('Done')).style('glassProminent'),
          ),
          Button(Text('Delete'))
            .style('subtle')
            .tint('danger')
            .onPress(() => setAsking(true))
            .confirmationDialog(
              [asking, setAsking],
              ConfirmationDialog(
                'Delete this post?',
                Item('Delete').destructive(),
                Item('Archive instead'),
              ).message('It cannot be undone.'),
            ),
          HStack(
            Button(Icon(RiHeart3Line))
              .shape('circle')
              .label('Like')
              .onPress(() => setLikes((n) => n + 1))
              .phases(
                ['rest', 'lift', 'settle'] as const,
                likes,
                (v, phase) =>
                  v
                    .offset({ y: phase === 'lift' ? '-sm' : 'none' })
                    .scale(phase === 'lift' ? 'swell' : 'full'),
                (phase) => (phase === 'lift' ? 'pop' : 'select'),
              ),
            Button(Icon(RiStarLine))
              .shape('circle')
              .label('Star')
              .onPress(() => setStars((n) => n + 1))
              .keyframes(bounce, stars),
          ).spacing('md'),
          VStack(
            ViewThatFits(
              'horizontal',
              Text('Share this post with everyone you follow'),
              Text('Share with followers'),
              Text('Share'),
            ),
          ).frame({ width: '160' }),
          VStack(
            ScrollArea(...Array.from({ length: 30 }, (_, i) => Text(`Message ${i + 1}`)))
              .spacing('sm')
              .safeAreaInset('top', Text('Filters').padding('sm'), 'sm')
              .safeAreaBar('bottom', Text('Composer').padding('md')),
          ).frame({ height: '384' }),
        ).spacing('2xl'),
      )}
    </View>
  );
}

const meta: Meta<typeof Adoptions> = {
  id: 'language-swiftui',
  title: 'Language/From SwiftUI',
  component: Adoptions,
};
export default meta;

/** Confirmation dialogs, toolbar groups, phases and keyframe tracks, ViewThatFits and insets on a scroll. */
export const Web: StoryObj<typeof Adoptions> = {};
