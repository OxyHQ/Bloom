import { Button } from '@oxy.so/bloom/button';
import { RiArrowRightLine, RiHeart3Line, RiMoreFill } from '@oxy.so/bloom/icons';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const onPress = () => {};

const matrix: ParityCase[] = (['solid', 'subtle', 'outline', 'plain'] as const).flatMap((style) =>
  ENUMS.tone.map((tone) => ({
    name: `${style} ${tone}`,
    language: () => toElement(L.Button(L.Text('Save')).style(style).tint(tone).onPress(onPress)),
    bloom: () => (
      <Button appearance={style} tone={tone} onPress={onPress}>
        Save
      </Button>
    ),
  })),
);

const sizes: ParityCase[] = ENUMS.controlSize.map((size) => ({
  name: `size ${size}`,
  language: () => toElement(L.Button(L.Icon(RiHeart3Line), L.Text('Like')).size(size)),
  bloom: () => (
    <Button size={size} leadingIcon={RiHeart3Line}>
      Like
    </Button>
  ),
}));

const content: ParityCase[] = [
  {
    name: 'a trailing icon',
    language: () => toElement(L.Button(L.Text('Next'), L.Icon(RiArrowRightLine))),
    bloom: () => <Button trailingIcon={RiArrowRightLine}>Next</Button>,
  },
  {
    name: 'leading and trailing icons',
    language: () =>
      toElement(L.Button(L.Icon(RiHeart3Line), L.Text('Saved'), L.Icon(RiArrowRightLine))),
    bloom: () => (
      <Button leadingIcon={RiHeart3Line} trailingIcon={RiArrowRightLine}>
        Saved
      </Button>
    ),
  },
  {
    name: 'icon only, circle',
    language: () =>
      toElement(L.Button(L.Icon(RiMoreFill)).style('subtle').shape('circle').label('More')),
    bloom: () => (
      <Button appearance="subtle" leadingIcon={RiMoreFill} iconOnly accessibilityLabel="More" />
    ),
  },
  {
    name: 'icon only, pill',
    language: () => toElement(L.Button(L.Icon(RiMoreFill)).shape('pill').label('More')),
    bloom: () => <Button leadingIcon={RiMoreFill} iconOnly wide accessibilityLabel="More" />,
  },
  {
    name: 'a glyph in its own ink',
    language: () =>
      toElement(L.Button(L.Icon(RiHeart3Line).foreground('error')).shape('circle').label('Like')),
    bloom: () => (
      <Themed>
        {(c) => (
          <Button
            icon={<RiHeart3Line width={20} height={20} fill={c.error} />}
            accessibilityLabel="Like"
          />
        )}
      </Themed>
    ),
  },
];

const states: ParityCase[] = [
  {
    name: 'loading',
    language: () => toElement(L.Button(L.Text('Send')).loading()),
    bloom: () => <Button loading>Send</Button>,
  },
  {
    name: 'disabled',
    language: () => toElement(L.Button(L.Text('Send')).disabled().onPress(onPress)),
    bloom: () => (
      <Button disabled onPress={onPress}>
        Send
      </Button>
    ),
  },
  ...[true, false].map((pressed) => ({
    name: `a toggle, ${pressed ? 'on' : 'off'}`,
    language: () =>
      toElement(L.Button(L.Text('Bold')).style('subtle').pressed(pressed).onPress(onPress)),
    bloom: () => (
      <Button appearance="subtle" pressed={pressed} onPress={onPress}>
        Bold
      </Button>
    ),
  })),
  {
    name: 'a link',
    language: () => toElement(L.Button(L.Text('Docs')).style('plain').link('https://oxy.so/docs')),
    bloom: () => (
      <Button appearance="plain" href="https://oxy.so/docs">
        Docs
      </Button>
    ),
  },
  {
    name: 'one line, underlined',
    language: () =>
      toElement(L.Button(L.Text('A label long enough to cut')).style('plain').lines(1).underline()),
    bloom: () => (
      <Button appearance="plain" numberOfLines={1} underline="rest">
        A label long enough to cut
      </Button>
    ),
  },
  {
    name: 'named, with a hint and an id',
    language: () =>
      toElement(
        L.Button(L.Text('Delete'))
          .tint('danger')
          .label('Delete the post')
          .hint('It cannot be undone')
          .testID('delete')
          .onPress(onPress),
      ),
    bloom: () => (
      <Button
        tone="danger"
        accessibilityLabel="Delete the post"
        accessibilityHint="It cannot be undone"
        testID="delete"
        onPress={onPress}
      >
        Delete
      </Button>
    ),
  },
];

const leftovers: ParityCase[] = [
  {
    name: 'a paired fill and label from roles',
    language: () =>
      toElement(L.Button(L.Text('Continue')).colors('primary', 'onPrimary').onPress(onPress)),
    bloom: () => (
      <Themed>
        {(colors) => (
          <Button
            colors={{ background: colors.primary, foreground: colors.primaryForeground }}
            onPress={onPress}
          >
            Continue
          </Button>
        )}
      </Themed>
    ),
  },
  ...ENUMS.linkTone.map((tone) => ({
    name: `link tone ${tone}`,
    language: () =>
      toElement(L.Button(L.Text('Terms')).style('plain').linkTone(tone).onPress(onPress)),
    bloom: () => (
      <Button appearance="plain" linkTone={tone} onPress={onPress}>
        Terms
      </Button>
    ),
  })),
  {
    name: 'inverted',
    language: () => toElement(L.Button(L.Text('Join')).inverted().onPress(onPress)),
    bloom: () => (
      <Button inverted onPress={onPress}>
        Join
      </Button>
    ),
  },
  ...ENUMS.density.map((density) => ({
    name: `density ${density}`,
    language: () => toElement(L.Button(L.Text('Edit')).density(density)),
    bloom: () => <Button density={density}>Edit</Button>,
  })),
  {
    name: 'an icon button that fits its content',
    language: () => toElement(L.Button(L.Icon(RiMoreFill)).shape('fit').label('More')),
    bloom: () => <Button leadingIcon={RiMoreFill} grow accessibilityLabel="More" />,
  },
  {
    name: 'a group, vertical, separated, at a size',
    language: () =>
      toElement(
        L.ButtonGroup(L.Button(L.Text('Day')), L.Button(L.Text('Week')))
          .axis('vertical')
          .separated()
          .size('sm')
          .label('Range'),
      ),
    bloom: () => (
      <Button.Group orientation="vertical" separated size="sm" accessibilityLabel="Range">
        <Button>Day</Button>
        <Button>Week</Button>
      </Button.Group>
    ),
  },
  {
    name: 'a group without dividers',
    language: () =>
      toElement(
        L.ButtonGroup(L.Button(L.Text('Bold')), L.Button(L.Text('Italic'))).dividers(false),
      ),
    bloom: () => (
      <Button.Group dividers={false}>
        <Button>Bold</Button>
        <Button>Italic</Button>
      </Button.Group>
    ),
  },
  {
    name: 'a group on glass: the lens group',
    language: () =>
      toElement(L.ButtonGroup(L.Button(L.Text('Back')), L.Button(L.Text('Next'))).glass()),
    bloom: () => (
      <Button.Group material="lens">
        <Button>Back</Button>
        <Button>Next</Button>
      </Button.Group>
    ),
  },
];

export const BUTTON_CASES: ParityCase[] = [
  ...matrix,
  ...sizes,
  ...content,
  ...states,
  ...leftovers,
];
