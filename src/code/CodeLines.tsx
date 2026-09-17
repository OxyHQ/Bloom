import React, { createElement, memo, useMemo } from 'react';
import { ScrollView, Text as RNText, View } from 'react-native';

import { flattenWebStyle } from '../styles/flatten-web-style';
import { tokenizeCode } from './highlight';
import {
  dataHook,
  IS_WEB,
  LINE_METRICS,
  MONO_FAMILY,
  tokenColor,
  useCodePalette,
  useCodeWebCss,
} from './shared';
import type { CodeLinesProps } from './types';

/**
 * Highlighted, numbered lines of code — the body of a `CodeBlock` and of a full
 * code panel.
 *
 *   line     a row: the number (right-aligned, the punctuation tone, never
 *            selected) then the code, `gap` apart
 *   sm       JetBrains Mono 11/18, numbers 12 wide, gap 12
 *   md       JetBrains Mono 13/23, numbers 20 wide, gap 13, rows at least 23 tall
 *   wrap     off: every line keeps its width and the view scrolls sideways
 *            (thin scrollbar); on: a long line soft-wraps under itself, its
 *            number staying on the first row
 *
 * On web the lines are a real `<pre><code>`, so find-in-page, copy and assistive
 * technology treat them as code.
 */
function CodeLinesComponent({
  code,
  language,
  highlight,
  lineNumbers = true,
  wrap = false,
  size = 'sm',
  style,
  testID,
}: CodeLinesProps) {
  useCodeWebCss();
  const palette = useCodePalette();
  const lines = useMemo(() => tokenizeCode(code, language, highlight), [code, language, highlight]);
  const metrics = LINE_METRICS[size];

  if (IS_WEB) {
    return createElement(
      'pre',
      {
        'data-testid': testID,
        'data-bloom-code-scroll': wrap ? undefined : '',
        style: {
          margin: 0,
          overflowX: wrap ? 'visible' : 'auto',
          fontFamily: MONO_FAMILY,
          fontSize: metrics.fontSize,
          lineHeight: `${metrics.lineHeight}px`,
          // JetBrains Mono's contextual ligatures would draw `===` and `=>` as
          // single glyphs; code reads character by character.
          fontVariantLigatures: 'none',
          color: palette.plain,
          ...flattenWebStyle(style),
        },
      },
      createElement(
        'code',
        { style: { display: 'block', fontFamily: 'inherit' } },
        lines.map((line, index) =>
          createElement(
            'span',
            {
              key: index,
              style: {
                display: 'flex',
                alignItems: 'flex-start',
                gap: lineNumbers ? metrics.gap : 0,
                minHeight: metrics.lineHeight,
                ...(wrap ? null : { minWidth: 'max-content' }),
              },
            },
            lineNumbers
              ? createElement(
                  'span',
                  {
                    'aria-hidden': true,
                    'data-bloom-code-number': '',
                    style: { width: metrics.number, flexShrink: 0, textAlign: 'right', color: palette.lineNumber },
                  },
                  String(index + 1),
                )
              : null,
            createElement(
              'span',
              {
                style: wrap
                  ? { minWidth: 0, flex: 1, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }
                  : { whiteSpace: 'pre' },
              },
              line.length
                ? line.map((token, t) =>
                    createElement('span', { key: t, style: { color: tokenColor(token.kind, palette) } }, token.text),
                  )
                : '\n',
            ),
          ),
        ),
      ),
    );
  }

  const rows = lines.map((line, index) => (
    <View key={index} style={{ minHeight: metrics.lineHeight, flexDirection: 'row', alignItems: 'flex-start', gap: lineNumbers ? metrics.gap : 0 }}>
      {lineNumbers ? (
        <RNText
          selectable={false}
          style={{
            width: metrics.number,
            flexShrink: 0,
            textAlign: 'right',
            fontFamily: MONO_FAMILY,
            fontSize: metrics.fontSize,
            lineHeight: metrics.lineHeight,
            color: palette.lineNumber,
          }}>
          {String(index + 1)}
        </RNText>
      ) : null}
      <RNText
        style={{
          ...(wrap ? { minWidth: 0, flex: 1 } : null),
          fontFamily: MONO_FAMILY,
          fontSize: metrics.fontSize,
          lineHeight: metrics.lineHeight,
          color: palette.plain,
        }}>
        {line.length === 0
          ? ' '
          : line.length === 1 && line[0]!.kind === 'plain'
            ? line[0]!.text
            : line.map((token, t) => (
                <RNText key={t} style={{ color: tokenColor(token.kind, palette) }}>
                  {token.text}
                </RNText>
              ))}
      </RNText>
    </View>
  ));

  if (wrap) {
    return (
      <View testID={testID} style={style}>
        {rows}
      </View>
    );
  }
  return (
    <ScrollView horizontal testID={testID} {...dataHook('bloomCodeScroll')} style={{ flexGrow: 0 }} contentContainerStyle={[{ flexDirection: 'column' }, style]}>
      {rows}
    </ScrollView>
  );
}

export const CodeLines = memo(CodeLinesComponent);
CodeLines.displayName = 'CodeLines';
