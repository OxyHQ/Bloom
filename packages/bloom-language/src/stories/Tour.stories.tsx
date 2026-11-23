import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RiArrowRightSLine } from '@oxy.so/bloom/icons/RiArrowRightSLine';
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine';
import { RiHeart3Fill } from '@oxy.so/bloom/icons/RiHeart3Fill';
import { RiHeart3Line } from '@oxy.so/bloom/icons/RiHeart3Line';
import { RiMarkPenLine } from '@oxy.so/bloom/icons/RiMarkPenLine';
import { RiPencilLine } from '@oxy.so/bloom/icons/RiPencilLine';

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Field,
  Fill,
  GlassGroup,
  HStack,
  Icon,
  ListItem,
  Option,
  Picker,
  Segmented,
  Spacer,
  Text,
  TextField,
  Toggle,
  VStack,
  ZStack,
  defineModifier,
  move,
  opacity,
  regular,
  toElement,
  useNamespace,
  view,
} from '../index';

/**
 * The tour (docs/bloom-language-tour.mdx), live: each story is one topic's
 * example, written as an app writes it, drawn by the language. The parity
 * stories beside these hold each node equal to Bloom; these show how the
 * pieces read together.
 */

const SettingRow = view(function SettingRow({ title, value }: { title: string; value: string }) {
  return HStack(
    VStack(Text(title).font('body'), Text(value).font('caption-1').foreground('muted')).spacing(
      '2xs',
    ),
    Spacer(),
    Icon(RiArrowRightSLine).size('sm').foreground('muted'),
  )
    .spacing('sm')
    .padding('md')
    .onPress(() => {})
    .when('hovered', (v) => v.background('mutedFill'));
});

const sectionCard = defineModifier((v) =>
  v.padding('xs').background('card').corner('xl').border('border', 'hairline'),
);

function ViewsAndStacks() {
  return toElement(
    VStack(
      SettingRow({ title: 'Language', value: 'English' }),
      SettingRow({ title: 'Theme', value: 'System' }),
      SettingRow({ title: 'Notifications', value: 'On' }),
    )
      .modifier(sectionCard)
      .frame({ maxWidth: '384' }),
  );
}

function ModifiersAndOrder() {
  const label = (text: string) => Text(text).font('caption-1').foreground('muted');
  return toElement(
    HStack(
      VStack(
        label('.padding().background()'),
        VStack(Text('Filled')).padding('md').background('primary/10').corner('lg'),
      ).spacing('xs'),
      VStack(
        label('.background().padding()'),
        VStack(Text('Spaced')).background('primary/10').corner('lg').padding('md'),
      ).spacing('xs'),
    ).spacing('xl'),
  );
}

const Tile = view(function Tile({ name, price }: { name: string; price: string }) {
  const [selected, setSelected] = useState(false);
  return VStack(Text(name).font('headline').weight('semibold'), Text(price).foreground('muted'))
    .spacing('2xs')
    .padding('md')
    .background('mutedFill')
    .corner('lg')
    .onPress(() => setSelected(!selected))
    .when('md', (v) => v.padding('lg'))
    .when('hovered', (v) => v.background('secondary'))
    .when('pressed', (v) => v.opacity('70'))
    .when(selected, (v) => v.background('primary').foreground('onPrimary'));
});

function Variants() {
  return toElement(
    HStack(Tile({ name: 'Free', price: '0 €' }), Tile({ name: 'Pro', price: '8 €' })).spacing('md'),
  );
}

const ProfileForm = view(function ProfileForm() {
  const name = useState('');
  const visibility = useState<'public' | 'private'>('public');
  const country = useState<string | undefined>(undefined);
  const notify = useState(true);
  const [saved, setSaved] = useState(false);
  return VStack(
    Field('Name', TextField(name, 'Name').placeholder('Ada Lovelace')).required(),
    Segmented(visibility, Option('public', 'Public'), Option('private', 'Private')).label(
      'Visibility',
    ),
    Picker(country, Option('pt', 'Portugal'), Option('es', 'Spain'))
      .placeholder('Country')
      .label('Country'),
    HStack(Text('Notifications'), Spacer(), Toggle(notify).label('Notifications')),
    Button(Text(saved ? 'Saved' : 'Save'))
      .disabled(name[0].trim() === '')
      .onPress(() => setSaved(true)),
  )
    .spacing('md')
    .frame({ maxWidth: '384' });
});

function Bindings() {
  return toElement(ProfileForm({}));
}

function Layout() {
  return toElement(
    VStack(
      HStack(
        Avatar('https://i.pravatar.cc/96?img=5')
          .size('lg')
          .overlay(Badge(3).tint('danger'), 'top-trailing'),
        VStack(Text('Ana Lima').weight('semibold'), Text('Design lead').foreground('muted')),
      ).spacing('md'),
      ZStack(Fill().background('mutedFill'), Text('Over the fill').padding('md'))
        .alignment('bottom-leading')
        .frame({ width: 'full', height: '120' })
        .corner('lg')
        .clipped()
        .overlay(
          Button(Icon(RiCloseLine)).label('Close').style('plain').padding('xs'),
          'top-trailing',
        ),
    )
      .spacing('lg')
      .frame({ maxWidth: '384' }),
  );
}

function Lists() {
  const people = [
    { id: '1', name: 'Ana Lima', role: 'Design lead', avatar: 'https://i.pravatar.cc/96?img=5' },
    { id: '2', name: 'Rui Costa', role: 'Engineer', avatar: 'https://i.pravatar.cc/96?img=12' },
    { id: '3', name: 'Maya Chen', role: 'Product', avatar: 'https://i.pravatar.cc/96?img=32' },
  ];
  return toElement(
    VStack(
      people.map((p) =>
        ListItem(p.name)
          .supporting(p.role)
          .prefix(Avatar(p.avatar).size('md'))
          .onPress(() => {})
          .id(p.id),
      ),
    ).frame({ maxWidth: '384' }),
  );
}

const DeleteButton = view(function DeleteButton() {
  const confirming = useState(false);
  return Button(Text('Delete post'))
    .style('subtle')
    .tint('danger')
    .onPress(() => confirming[1](true))
    .alert(
      confirming,
      Alert('Delete post?').message('It cannot be undone.').confirmLabel('Delete').destructive(),
    );
});

function Overlays() {
  return toElement(DeleteButton({}));
}

const Like = view(function Like() {
  const [liked, setLiked] = useState(false);
  return HStack(
    Button(Icon(liked ? RiHeart3Fill : RiHeart3Line))
      .label('Like')
      .tint(liked ? 'danger' : 'neutral')
      .scale(liked ? 'swell' : 'full')
      .animation('pop', liked)
      .onPress(() => setLiked(!liked)),
    liked
      ? Text('Liked')
          .foreground('muted')
          .transition(move('leading', 'sm').combined(opacity))
          .id('liked')
      : null,
  )
    .spacing('sm')
    .align('center');
});

function AnimationAndGestures() {
  return toElement(Like({}));
}

const Tools = view(function Tools() {
  const ns = useNamespace();
  const [marking, setMarking] = useState(false);
  return GlassGroup(
    HStack(
      Button(Icon(RiPencilLine))
        .label('Draw')
        .glass()
        .glassID('pencil', ns)
        .onPress(() => setMarking(!marking)),
      marking ? Button(Icon(RiMarkPenLine)).label('Highlight').glass().glassID('marker', ns) : null,
    ).spacing('xl'),
  )
    .blend('xl')
    .animation('expand', marking);
});

function Glass() {
  return toElement(
    ZStack(
      Fill().background('primary/30'),
      VStack(
        Tools({}),
        Text('Live')
          .padding('horizontal', 'sm')
          .padding('vertical', 'xs')
          .glass(regular.tint('error', 'medium'))
          .corner('full'),
      )
        .spacing('lg')
        .padding('xl'),
    )
      .corner('xl')
      .clipped(),
  );
}

const meta: Meta = {
  title: 'Language/Tour',
  parameters: {
    docs: {
      description: {
        component:
          'The Bloom language tour (docs/bloom-language-tour.mdx), one topic per story, written as an app writes it.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const ViewsAndStacksStory: Story = {
  name: 'Views and stacks',
  render: () => <ViewsAndStacks />,
};
export const ModifiersAndOrderStory: Story = {
  name: 'Modifiers and order',
  render: () => <ModifiersAndOrder />,
};
export const VariantsStory: Story = { name: 'Variants', render: () => <Variants /> };
export const BindingsStory: Story = { name: 'Bindings', render: () => <Bindings /> };
export const LayoutStory: Story = { name: 'Layout', render: () => <Layout /> };
export const ListsStory: Story = { name: 'Lists', render: () => <Lists /> };
export const OverlaysStory: Story = { name: 'Overlays', render: () => <Overlays /> };
export const AnimationStory: Story = { name: 'Animation', render: () => <AnimationAndGestures /> };
export const GlassStory: Story = { name: 'Glass', render: () => <Glass /> };
