import { Code, CodeBlock, CodeLines, Pre } from '@oxy.so/bloom/code';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const copy = () => {};
const SOURCE =
  "import { view } from '@oxy.so/bloom-language';\n\n// A row\nexport const answer = 42;\n";
const PATCH = ['+2', '-3', '4'];

export const CODE_CASES: readonly ParityCase[] = [
  {
    name: 'inline code',
    language: () => toElement(L.Code('bun run build')),
    bloom: () => <Code>bun run build</Code>,
  },
  {
    name: 'a preformatted block',
    language: () => toElement(L.Pre(SOURCE)),
    bloom: () => <Pre>{SOURCE}</Pre>,
  },
  {
    name: 'a preformatted block, highlighted, numbered, padded',
    language: () => toElement(L.Pre(SOURCE).language('ts').lineNumbers().padding('md')),
    bloom: () => (
      <Pre
        language="ts"
        lineNumbers
        containerStyle={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      >
        {SOURCE}
      </Pre>
    ),
  },
  ...ENUMS.codeLinesSize.map((size) => ({
    name: `numbered lines, ${size}`,
    language: () => toElement(L.CodeLines(SOURCE).language('tsx').size(size)),
    bloom: () => <CodeLines code={SOURCE} language="tsx" size={size} />,
  })),
  {
    name: 'lines highlighted, wrapping, unnumbered',
    language: () => toElement(L.CodeLines(SOURCE).highlight(PATCH).wrap().lineNumbers(false)),
    bloom: () => <CodeLines code={SOURCE} highlight={PATCH} wrap lineNumbers={false} />,
  },
  {
    name: 'a code card',
    language: () => toElement(L.CodeBlock(SOURCE).language('ts')),
    bloom: () => <CodeBlock code={SOURCE} language="ts" />,
  },
  {
    name: 'a code card with its header filled and copy of its own',
    language: () =>
      toElement(
        L.CodeBlock(SOURCE)
          .language('ts')
          .languageLabel('TypeScript')
          .filename('row.ts')
          .diff(3, 1)
          .highlight(PATCH)
          .onCopy(copy)
          .headerContent(L.Text('v2'))
          .labels({ copy: 'Copier', copied: 'Copié' })
          .testID('snippet'),
      ),
    bloom: () => (
      <CodeBlock
        code={SOURCE}
        language="ts"
        languageLabel="TypeScript"
        filename="row.ts"
        additions={3}
        deletions={1}
        highlight={PATCH}
        onCopy={copy}
        headerAccessory={<Text>v2</Text>}
        labels={{ copy: 'Copier', copied: 'Copié' }}
        testID="snippet"
      />
    ),
  },
  {
    name: 'a code card that cannot be copied, wrapping',
    language: () => toElement(L.CodeBlock(SOURCE).copyable(false).wrap()),
    bloom: () => <CodeBlock code={SOURCE} copyable={false} wrap />,
  },
];
