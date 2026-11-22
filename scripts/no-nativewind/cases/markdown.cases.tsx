import { Markdown } from '@bloom/markdown';
import type { Cases } from '../support/cases';

const DOC = `# Title

A paragraph with **bold**, *emphasis*, \`code\` and a [link](https://oxy.so).

- one
- two
  1. nested

> A quote

\`\`\`ts
const a = 1;
\`\`\`

| a | b |
| - | - |
| 1 | 2 |
`;

export const CASES: Cases = {
  'Markdown plain': () => <Markdown>Hello</Markdown>,
  'Markdown loaded': () => (
    <Markdown size="lg" style={{ padding: 4 }} testID="md">
      {DOC}
    </Markdown>
  ),
  'Markdown sm streaming': () => (
    <Markdown size="sm" streaming>
      {'**bold'}
    </Markdown>
  ),
};
