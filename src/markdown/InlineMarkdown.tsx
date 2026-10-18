import React, { memo, useMemo, type ReactNode } from 'react';
import { Linking, Text, type GestureResponderEvent } from 'react-native';

import { Code } from '../code';
import { IS_WEB } from '../styles/platform';
import { useTheme } from '../theme/use-theme';
import { parseInline } from './parse-inline';
import type { InlineMarkdownProps, MarkdownInline } from './types';
import { safeUrl } from './safe-url';

/**
 * One block's running text as nested `Text`. Nested on purpose: they inherit the
 * block's size, line height and colour, which a Bloom `Text` would reset.
 */
export const InlineMarkdown = memo(function InlineMarkdown({
  source,
  streaming = false,
  nodes: suppliedNodes,
  onLinkPress,
  renderText,
  renderLink,
  suffix,
}: InlineMarkdownProps) {
  const { colors } = useTheme();
  const nodes = useMemo(
    () => suppliedNodes ?? parseInline(source ?? '', streaming),
    [suppliedNodes, source, streaming],
  );

  const press = (url: string) => (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (onLinkPress) {
      event.preventDefault();
      onLinkPress(url);
    } else if (!IS_WEB) {
      void Linking.openURL(url);
    }
  };

  const render = (list: readonly MarkdownInline[], insideLink = false): ReactNode[] =>
    list.map((node, index) => {
      switch (node.type) {
        case 'text':
          return renderText && !insideLink ? (
            <React.Fragment key={index}>{renderText(node.value)}</React.Fragment>
          ) : (
            node.value
          );
        case 'break':
          return '\n';
        case 'code':
          return <Code key={index}>{node.value}</Code>;
        case 'strong':
          return (
            <Text key={index} style={{ fontWeight: '600' }}>
              {render(node.children, insideLink)}
            </Text>
          );
        case 'emphasis':
          return (
            <Text key={index} style={{ fontStyle: 'italic' }}>
              {render(node.children, insideLink)}
            </Text>
          );
        case 'delete':
          return (
            <Text key={index} style={{ textDecorationLine: 'line-through' }}>
              {render(node.children, insideLink)}
            </Text>
          );
        case 'link': {
          const children = render(node.children, true);
          const url = safeUrl(node.url);
          if (!url) return <React.Fragment key={index}>{children}</React.Fragment>;
          const custom = renderLink?.({ url, label: node.label, children });
          if (custom !== undefined) return <React.Fragment key={index}>{custom}</React.Fragment>;
          const webLink = IS_WEB
            ? {
                href: url,
                hrefAttrs: /^https?:/i.test(url)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : undefined,
              }
            : null;
          return (
            <Text
              key={index}
              role="link"
              onPress={press(url)}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              {...webLink}
            >
              {children}
            </Text>
          );
        }
      }
    });

  return (
    <>
      {render(nodes)}
      {suffix}
    </>
  );
});
