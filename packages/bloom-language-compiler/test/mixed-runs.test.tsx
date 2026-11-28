/**
 * A text run that is a view in one branch and a string in the other (`RawText(c ? Text("v") :
 * s ?? "")`, Mention's UserName): one Text host whose child is the view or the string, as TS's
 * `RawText(href ? Embed(<Link>) : primaryText)` is, and nothing for `none`.
 */
import { RawText, Text, toElement, VStack } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

import { measured } from './support/fibers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
type Props = { linked: boolean; verified: boolean; name?: string };
const { Name } = require('./bloom/mixed-runs.bloom') as {
  Name: (props: Props) => Parameters<typeof toElement>[0];
};

function texts(props: Props): string[] {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Name(props)));
  });
  const flat = (node: unknown): string =>
    node == null
      ? ''
      : typeof node === 'string'
        ? node
        : Array.isArray(node)
          ? node.map(flat).join('')
          : flat((node as { children?: unknown }).children);
  const tree = r.toJSON() as { children?: unknown[] };
  return (tree.children ?? []).map(flat);
}

it('draws the view or the string as the run', () => {
  expect(texts({ linked: true, verified: false, name: 'Ana' })).toEqual([
    'link',
    'link',
    'by @Ana',
  ]);
  expect(texts({ linked: false, verified: true, name: 'Ana' })).toEqual(['Ana', 'Ana', 'by ✓Ana']);
  expect(texts({ linked: false, verified: false })).toEqual(['', '', 'by ']);
});

it('costs what the hand-written run does', () => {
  const props = { linked: false, verified: false, name: 'Ana' };
  const hand = VStack(
    RawText(props.linked ? Text('link') : (props.name ?? '')),
    RawText(props.linked ? Text('link') : props.name),
    Text(
      'by ',
      props.verified ? Text('✓').weight('bold') : props.linked ? '@' : '',
      props.name ?? '',
    ),
  );
  expect(measured(toElement(Name(props)))).toEqual(measured(toElement(hand)));
});
