import React, { memo, useMemo } from 'react';

import { StyledView } from '../styles/styled-primitives';
import { MarkdownProvider } from './context';
import { MarkdownBlocks } from './MarkdownBlocks';
import type { MarkdownProps } from './types';
import { useMarkdownBlocks } from './use-markdown-blocks';

/**
 * A Markdown document set in Bloom's type ramp: headings, paragraphs, emphasis,
 * lists (nested, ordered, task), quotes, rules, tables, links and code.
 * A fenced block is a `CodeBlock`, inline code is `Code`. Raw HTML is shown as
 * text, and a link to anything but `http(s):`, `mailto:` or a relative path is
 * shown as plain text.
 *
 * Built for a reply that grows token by token: pass `streaming` while it does.
 * Finished blocks keep their identity from one render to the next, so only the
 * tail is read again.
 */
function MarkdownComponent({
  children,
  streaming = false,
  size = 'md',
  onLinkPress,
  renderCodeBlock,
  style,
  className,
  testID,
  ref,
}: MarkdownProps) {
  const segments = useMarkdownBlocks(children);
  const context = useMemo(
    () => ({ size, onLinkPress, renderCodeBlock }),
    [size, onLinkPress, renderCodeBlock],
  );
  const blocks = segments.map((segment) => segment.block);

  return (
    <StyledView ref={ref} className={className} style={style} testID={testID}>
      <MarkdownProvider value={context}>
        <MarkdownBlocks blocks={blocks} streaming={streaming} />
      </MarkdownProvider>
    </StyledView>
  );
}

export const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';
