import { HStack, Icon, Spacer, Text, VStack, ZStack, toElement } from '@oxy.so/bloom-language';
import { Glyph } from './glyphs';

/** Stacks, layers in and against their order, spacing and placement. */
export const hoisted = 5;

function Card() {
  return VStack(
    Text('Title').font('headline').weight('semibold'),
    Text('Subtitle').font('sm').foreground('muted').lines(1),
  )
    .spacing('xs')
    .padding('md')
    .background('surface')
    .corner('lg');
}

function Layers() {
  return VStack(
    Text('fill under padding').padding('md').background('surface'),
    Text('padding outside fill').background('surface').padding('md'),
    Text('unclipped').corner('lg').background('surface'),
    Text('edges').padding('leading', 'md').padding('trailing', 'lg').padding('leading', '-xs'),
    Text('framed').frame({ height: 'xl', minWidth: 'none' }).padding('md'),
    Text('rule').border('border', 'hairline', 'bottom').opacity('half'),
  );
}

function Toolbar(gap: 'sm' | 'md') {
  // The static prefix is hoisted; the runtime spacing stays where it runs.
  return HStack(
    Icon(Glyph).size('sm'),
    Text('Name').shrink('first').frame({ minWidth: 'none' }),
    Spacer(),
  )
    .align('center')
    .padding('horizontal', 'md')
    .spacing(gap);
}

function Depth() {
  return ZStack(VStack().frame({ width: '5xl', height: '5xl' }), Text('over')).corner('full');
}

function Placed() {
  return VStack(
    HStack(Text('a'), Text('b')).justify('between').wrap().spacing('sm'),
    Text('pinned').position({ top: 'none', trailing: 'sm' }).zIndex('floating'),
    Text('centred').alignSelf('center').frame({ width: 'full', maxWidth: '1/2' }),
    Text('1,024').monospacedDigit().wordBreak('all').basis('none').scale('105'),
    Text('read aloud').accessibilityOnly(),
    VStack(Text('a'), Text('b')).listMarker('disc').corner('3xl', 'top').allowsHitTesting(false),
  )
    .overlay(Text('badge'), 'top-trailing')
    .corner('lg')
    .shadow('m')
    .ring('border')
    .when('md', (v) => v.padding('lg').justify('center'))
    .when('dark', (v) => v.ring('primary'));
}

export const cases = {
  placed: () => toElement(Placed()),
  card: () => toElement(Card()),
  layers: () => toElement(Layers()),
  toolbarSm: () => toElement(Toolbar('sm')),
  toolbarMd: () => toElement(Toolbar('md')),
  depth: () => toElement(Depth()),
};
