import React, { memo } from 'react';
import { useMarkdownContext } from './context';
import { InlineMarkdown } from './InlineMarkdown';

interface InlineTextProps {
  source: string;
  streaming: boolean;
}

/** Block documents and inline consumers share one renderer. */
export const MarkdownInlineText = memo(function MarkdownInlineText(props: InlineTextProps) {
  const { onLinkPress } = useMarkdownContext();
  return <InlineMarkdown {...props} onLinkPress={onLinkPress} />;
});
