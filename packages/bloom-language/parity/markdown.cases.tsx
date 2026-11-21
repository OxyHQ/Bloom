import { Text as RNText } from 'react-native';
import { InlineMarkdown, Markdown } from '@oxy.so/bloom/markdown';
import { fontFamilyStyle, Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

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
  {
    name: 'inline markdown in a text',
    language: () =>
      toElement(
        L.Text(
          'Note: ',
          L.InlineMarkdown('Read **this**, `code` and [the docs](https://example.com)'),
        ),
      ),
    bloom: () => (
      <Text>
        {'Note: '}
        <InlineMarkdown source="Read **this**, `code` and [the docs](https://example.com)" />
      </Text>
    ),
  },
  {
    name: 'inline markdown streaming, its links pressed by the app',
    language: () =>
      toElement(
        L.Text(
          L.InlineMarkdown('Half **open and [a link](https://example.com)')
            .streaming()
            .onLinkPress(open),
        ),
      ),
    bloom: () => (
      <Text>
        <InlineMarkdown
          source="Half **open and [a link](https://example.com)"
          streaming
          onLinkPress={open}
        />
      </Text>
    ),
  },
  {
    name: 'inline markdown with plain runs, links and a suffix of its own',
    language: () =>
      toElement(
        L.Text(
          L.InlineMarkdown('Hi @ana, see [this](https://example.com)')
            .plainRun((text) => L.Text(text).weight('medium'))
            .linkView((link) => L.Text(link.label ?? link.url).underline())
            .suffix(L.Text(' more').foreground('primary')),
        ),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Text>
            <InlineMarkdown
              source="Hi @ana, see [this](https://example.com)"
              renderText={(text) => <RNText style={{ fontWeight: '500' }}>{text}</RNText>}
              renderLink={(link) => (
                <RNText style={{ textDecorationLine: 'underline' }}>
                  {link.label ?? link.url}
                </RNText>
              )}
              suffix={<RNText style={{ color: c.primary }}> more</RNText>}
            />
          </Text>
        )}
      </Themed>
    ),
  },
  {
    name: 'inline markdown of parsed runs',
    language: () =>
      toElement(
        L.Text(
          L.InlineMarkdown([
            { type: 'text', value: 'plain ' },
            { type: 'code', value: 'x' },
          ]),
        ),
      ),
    bloom: () => (
      <Text>
        <InlineMarkdown
          nodes={[
            { type: 'text', value: 'plain ' },
            { type: 'code', value: 'x' },
          ]}
        />
      </Text>
    ),
  },
];
