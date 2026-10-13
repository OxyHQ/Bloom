import React, { memo, useMemo, type ReactNode } from 'react';
import { Linking, Text, type GestureResponderEvent } from 'react-native';

import { Code } from '../code';
import { IS_WEB } from '../styles/platform';
import { useTheme } from '../theme/use-theme';
import { useMarkdownContext } from './context';
import { parseInline } from './parse-inline';
import type { MarkdownInline } from './types';

interface InlineTextProps {
  /** The inline Markdown source of one block. */
  source: string;
  /** The text may still grow: close what is open at its end. */
  streaming: boolean;
}

/**
 * One block's running text as nested `Text`. Nested on purpose: they inherit the
 * block's size, line height and colour, which a Bloom `Text` would reset.
 */
export const MarkdownInlineText = memo(function MarkdownInlineText({
  source,
  streaming,
}: InlineTextProps) {
  const { colors } = useTheme();
  const { onLinkPress } = useMarkdownContext();
  const nodes = useMemo(() => parseInline(source, streaming), [source, streaming]);

  const press = (url: string) => (event: GestureResponderEvent) => {
    if (onLinkPress) {
      event.preventDefault();
      onLinkPress(url);
    } else if (!IS_WEB) {
      void Linking.openURL(url);
    }
  };

  const render = (list: MarkdownInline[]): ReactNode[] =>
    list.map((node, index) => {
      switch (node.type) {
        case 'text':
          return node.value;
        case 'break':
          return '\n';
        case 'code':
          return <Code key={index}>{node.value}</Code>;
        case 'strong':
          return (
            <Text key={index} style={{ fontWeight: '600' }}>
              {render(node.children)}
            </Text>
          );
        case 'emphasis':
          return (
            <Text key={index} style={{ fontStyle: 'italic' }}>
              {render(node.children)}
            </Text>
          );
        case 'delete':
          return (
            <Text key={index} style={{ textDecorationLine: 'line-through' }}>
              {render(node.children)}
            </Text>
          );
        case 'link': {
          const webLink = IS_WEB
            ? {
                href: node.url,
                hrefAttrs: /^https?:/i.test(node.url)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : undefined,
              }
            : null;
          return (
            <Text
              key={index}
              role="link"
              onPress={press(node.url)}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              {...webLink}
            >
              {render(node.children)}
            </Text>
          );
        }
      }
    });

  return <>{render(nodes)}</>;
});
