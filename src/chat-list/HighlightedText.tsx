import React, { memo, useMemo } from 'react';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { highlightRuns, resolveChatListPaint } from './shared';
import type { HighlightedTextProps } from './types';

/**
 * `text` with every occurrence of `query` marked.
 *
 * Matching folds case AND accents, so "jose" finds "José" — but the runs are
 * sliced out of the ORIGINAL string, never out of the folded one, so what is
 * drawn is exactly what was passed in. Folding is not length-preserving (a
 * combining mark disappears), which is why `highlightRuns` maps offsets back
 * through a per-character index rather than assuming the two strings line up.
 *
 * The match is marked with COLOUR, not a band: inside a one-line search result a
 * tinted background reads as a second badge beside the unread pill. Pass
 * `highlightBackground` where the text has room to breathe.
 *
 * One `<Text>` with nested spans, so it truncates and wraps as a single string.
 */

function HighlightedTextComponent({
  text,
  query,
  variant = 'body-regular',
  color,
  highlightColor,
  highlightBackground,
  numberOfLines,
  style,
  testID,
}: HighlightedTextProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const runs = useMemo(() => highlightRuns(text, query), [query, text]);

  return (
    <Text
      variant={variant}
      numberOfLines={numberOfLines}
      style={[{ color: color ?? paint.text }, style]}
      testID={testID}
    >
      {runs.map((run, index) =>
        run.match ? (
          <Text
            key={index}
            style={{
              color: highlightColor ?? paint.accent,
              ...(highlightBackground ? { backgroundColor: highlightBackground } : null),
            }}
          >
            {run.text}
          </Text>
        ) : (
          run.text
        ),
      )}
    </Text>
  );
}

export const HighlightedText = memo(HighlightedTextComponent);
HighlightedText.displayName = 'HighlightedText';
