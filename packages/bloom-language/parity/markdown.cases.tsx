import { Markdown } from '@oxy.so/bloom/markdown';
import { fontFamilyStyle, Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const open = () => {};
const SOURCE = [
  '# Release notes',
  '',
  'Bloom draws **bold**, *italic*, `code` and [links](https://oxy.so).',
  '',
  '- one',
  '- [x] done',
  '',
  '1. first',
  '2. second',
  '',
  '> A quote',
  '',
  '| Name | Score |',
  '| :--- | ---: |',
  '| Ana | 42 |',
  '',
  '```ts',
  'const x = 1;',
  '```',
  '',
  '---',
].join('\n');
const STREAMING = 'Half a **sentence and an open `span';

export const MARKDOWN_CASES: readonly ParityCase[] = [
  {
    name: 'every block',
    language: () => toElement(L.Markdown(SOURCE)),
    bloom: () => <Markdown>{SOURCE}</Markdown>,
  },
  ...ENUMS.markdownSize.map((size) => ({
    name: `size ${size}`,
    language: () => toElement(L.Markdown(SOURCE).size(size)),
    bloom: () => <Markdown size={size}>{SOURCE}</Markdown>,
  })),
  {
    name: 'streaming',
    language: () => toElement(L.Markdown(STREAMING).streaming()),
    bloom: () => <Markdown streaming>{STREAMING}</Markdown>,
  },
  {
    name: 'links of its own, a code block of its own, padded',
    language: () =>
      toElement(
        L.Markdown(SOURCE)
          .onLinkPress(open)
          .codeBlock((code) => L.Text(code).font('mono'))
          .padding('md')
          .testID('notes'),
      ),
    bloom: () => (
      <Markdown
        onLinkPress={open}
        renderCodeBlock={(code) => <Text style={fontFamilyStyle('mono')}>{code}</Text>}
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
        testID="notes"
      >
        {SOURCE}
      </Markdown>
    ),
  },
];
