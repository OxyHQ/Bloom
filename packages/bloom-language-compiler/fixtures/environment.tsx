import {
  Embed,
  HStack,
  Icon,
  Text,
  VStack,
  defineTokens,
  toElement,
  view,
} from '@oxy.so/bloom-language';
import { createElement } from 'react';
import { Glyph } from './glyphs';

/** Inherited text traits, inline spans, app tokens and the environment across views. */
export const hoisted = 6;

const app = defineTokens({
  space: { gutter: 64, contextGap: 3 },
  iconSize: { context: 13 },
  leading: { tight: 1.25 },
});

const Label = view(function Label(props: { text: string }) {
  return Text(props.text);
});

const Badge = view(function Badge() {
  return Text('New').font('caption-1').weight('bold');
});

function Inherited() {
  return HStack(Icon(Glyph).size('sm'), Text('Reposted by ', Text('Ana').weight('bold')))
    .foreground('muted')
    .font('sm')
    .leading('snug');
}

function Tokens() {
  return VStack(
    Text('gutter').padding('leading', app.space.gutter).font('md').leading(app.leading.tight),
    Icon(Glyph).size(app.iconSize.context).padding('trailing', app.space.contextGap),
  );
}

function AcrossViews(text: string) {
  return VStack(VStack(Label({ text }), Badge()).foreground('primary'), Label({ text: 'plain' }));
}

function Embedded() {
  return VStack(
    Embed((render) => createElement('Wrapper', null, render(Text('inside').font('body')))),
  ).foreground('muted');
}

export const cases = {
  inherited: () => toElement(Inherited()),
  tokens: () => toElement(Tokens()),
  acrossViewsA: () => toElement(AcrossViews('a')),
  acrossViewsB: () => toElement(AcrossViews('b')),
  embedded: () => toElement(Embedded()),
};
