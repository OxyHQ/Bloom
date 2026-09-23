import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Code,
  CodeBlock,
  CodeLines,
  isHighlightedLanguage,
  tokenColor,
  tokenizeCode,
  useCodePalette,
  type CodePalette,
} from '../code';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

describe('Code', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(<Code>const x = 1</Code>);
    expect(getByText('const x = 1')).toBeTruthy();
  });

  it('applies the JetBrains Mono font family on native', () => {
    const { getByText } = renderWithTheme(<Code>foo</Code>);
    const node = getByText('foo');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    expect(flat.fontFamily).toBe('JetBrains Mono');
  });
});

describe('tokenizeCode', () => {
  const kinds = (source: string, language = 'tsx') =>
    tokenizeCode(source, language).flat().filter((t) => t.text.trim()).map((t) => `${t.kind}:${t.text.trim()}`);

  it('classifies keywords, names, strings, operators, constants and punctuation', () => {
    expect(kinds('import type { Metadata } from "next";')).toEqual([
      'keyword:import',
      'keyword:type',
      'punctuation:{',
      'className:Metadata',
      'punctuation:}',
      'keyword:from',
      'string:"next"',
      'punctuation:;',
    ]);
    expect(kinds('const MAX = a === 1 ? b.c(2) : null')).toEqual([
      'keyword:const',
      'constant:MAX',
      'operator:=',
      'plain:a',
      'operator:===',
      'constant:1',
      'operator:?',
      'plain:b',
      'punctuation:.',
      'function:c',
      'punctuation:(',
      'constant:2',
      'punctuation:)',
      'operator::',
      'keyword:null',
    ]);
  });

  it('reads JSX tags and attributes, and tells a tag from a less-than', () => {
    expect(kinds('<Shell wide title="Home" code={CODE} />')).toEqual([
      'punctuation:<',
      'className:Shell',
      'attrName:wide',
      'attrName:title',
      'punctuation:="',
      'attrValue:Home',
      'punctuation:"',
      'attrName:code',
      'punctuation:={',
      'constant:CODE',
      'punctuation:}',
      'punctuation:/>',
    ]);
    expect(kinds('if (a < b) x()')).toContain('operator:<');
  });

  it('splits multi-line tokens across lines and keeps empty lines', () => {
    const lines = tokenizeCode('/* one\ntwo */\n\nconst x = `a\nb`;', 'ts');
    expect(lines).toHaveLength(5);
    expect(lines[0]![0]).toEqual({ kind: 'comment', text: '/* one' });
    expect(lines[2]).toEqual([]);
    expect(lines[4]![0]).toEqual({ kind: 'string', text: 'b`' });
  });

  it('paints highlighted identifiers as class names, and leaves unknown languages plain', () => {
    expect(kinds('nextTheme = 1', 'js')[0]).toBe('plain:nextTheme');
    expect(tokenizeCode('nextTheme = 1', 'js', ['nextTheme'])[0]![0]).toEqual({ kind: 'className', text: 'nextTheme' });
    expect(tokenizeCode('name = "bloom"\n', 'toml')).toEqual([[{ kind: 'plain', text: 'name = "bloom"' }], []]);
    expect(isHighlightedLanguage('TypeScript')).toBe(true);
    expect(isHighlightedLanguage(undefined)).toBe(false);
  });
});

describe('CodeBlock', () => {
  it('renders the header, numbered lines and highlighted tokens', () => {
    const { getByText, getAllByText } = renderWithTheme(
      <CodeBlock code={'const a = 1;\nconst b = 2;'} language="ts" filename="a.ts" additions={3} deletions={1} onCopy={() => {}} />,
    );
    expect(getByText('TS')).toBeTruthy();
    expect(getByText('a.ts')).toBeTruthy();
    expect(getByText('+3')).toBeTruthy();
    expect(getByText('-1')).toBeTruthy();
    expect(getAllByText('const')).toHaveLength(2);
    expect(getAllByText('2').length).toBeGreaterThan(0);
  });

  it('copies through `onCopy` and shows the check for 1.6s', async () => {
    jest.useFakeTimers();
    const onCopy = jest.fn();
    const { getByLabelText, queryByLabelText } = renderWithTheme(<CodeBlock code="x" filename="x.ts" onCopy={onCopy} />);
    await act(async () => {
      fireEvent.press(getByLabelText('Copy code'));
    });
    expect(onCopy).toHaveBeenCalledWith('x');
    expect(getByLabelText('Code copied')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1700);
    });
    expect(queryByLabelText('Code copied')).toBeNull();
    jest.useRealTimers();
  });

  it('leaves the header out when there is nothing to put in it', () => {
    const { queryByLabelText } = renderWithTheme(<CodeBlock code="x" copyable={false} />);
    expect(queryByLabelText('Copy code')).toBeNull();
  });
});

describe('CodeLines', () => {
  it('numbers lines by default and drops the numbers on request', () => {
    const numbered = renderWithTheme(<CodeLines code={'a\nb'} />);
    expect(numbered.getByText('2')).toBeTruthy();
    const bare = renderWithTheme(<CodeLines code={'a\nb'} lineNumbers={false} />);
    expect(bare.queryByText('2')).toBeNull();
  });
});

describe('tokenColor', () => {
  it('paints a token the colour CodeLines paints it', () => {
    let palette: CodePalette | undefined;
    function Probe() {
      palette = useCodePalette();
      return null;
    }
    renderWithTheme(<Probe />);
    const { getByText } = renderWithTheme(<CodeLines code="const a = 1" language="ts" />);
    const flat = (style: unknown): Record<string, unknown> =>
      Array.isArray(style) ? Object.assign({}, ...style.map(flat)) : ((style as Record<string, unknown>) ?? {});
    expect(flat(getByText('const').props.style).color).toBe(tokenColor('keyword', palette!));
  });
});
