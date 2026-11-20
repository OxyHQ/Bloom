import {
  HStack,
  Icon,
  Text,
  VStack,
  ZStack,
  asymmetric,
  defineKeyframes,
  move,
  opacity,
  regular,
  scale,
  toElement,
  useNamespace,
  view,
} from '@oxy.so/bloom-language';
import { Glyph } from './glyphs';

/** Motion: transitions, keyframes, a content transition, a matched geometry, press feedback. */
export const hoisted = 5;

const pop = defineKeyframes(
  [
    { at: 0, scale: 1, easing: 'inOutQuad' },
    { at: 0.1, scale: 0.7 },
    { at: 0.4, scale: 1.2 },
    { at: 1, scale: 1 },
  ],
  'pop',
);

function Toasts(ids: string[]) {
  // Each row's static prefix, transition included, is hoisted; its id is the runtime's.
  return VStack(
    ids.map((id) =>
      VStack(Text('Saved').font('body'))
        .padding('md')
        .glass(regular)
        .corner('lg')
        .transition(
          asymmetric(
            move('top', 'xl').combined(opacity).animation('enter'),
            opacity.animation('exit'),
          ),
        )
        .id(id),
    ),
  ).spacing('sm');
}

function Like(count: number, press: number) {
  return HStack(
    Icon(Glyph).size('md').keyframes(pop, press),
    Text(String(count)).font('sm').contentTransition('roll', count).animation('roll', press),
  ).spacing('xs');
}

const Strip = view(function Strip({ selected }: { selected: string }) {
  const ns = useNamespace();
  return HStack(
    ['a', 'b'].map((id) =>
      ZStack(
        Text(id).padding('horizontal', 'md'),
        id === selected
          ? VStack().background('foreground').frame({ height: '2xs' }).matchedGeometry('line', ns)
          : null,
      ).id(id),
    ),
  ).animation('slide', selected);
});

function Pressable() {
  return HStack(Text('Open'), Icon(Glyph).scale('swell').transition(scale('dip')))
    .padding('md')
    .onPress(() => {})
    .pressScale();
}

export const cases = {
  toasts: () => toElement(Toasts(['a', 'b'])),
  like: () => toElement(Like(1, 0)),
  strip: () => toElement(Strip({ selected: 'a' })),
  pressable: () => toElement(Pressable()),
};
