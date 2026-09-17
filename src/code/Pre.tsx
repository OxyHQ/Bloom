import React, { memo } from 'react';
import { Text as RNText, View } from 'react-native';

import { CodeLines } from './CodeLines';
import { CARD_RADIUS, LINE_METRICS, MONO_FAMILY, useCodePalette } from './shared';
import type { PreProps } from './types';

/**
 * A block of code: the `CodeBlock` card without its header — radius 16, a 1px
 * border, the page surface and shadow-xs — holding the lines in JetBrains Mono
 * 11/18 at px 12 / py 10. It keeps its line breaks and indentation and scrolls
 * sideways rather than wrapping.
 *
 * A string child is laid out as `CodeLines` (a real `<pre><code>` on web),
 * highlighted when `language` names a JavaScript/TypeScript dialect and numbered
 * when `lineNumbers` is set. Any other child renders as monospace text in the
 * same card.
 */
const PreComponent = function Pre({ children, containerStyle, style, language, lineNumbers = false, ...rest }: PreProps) {
  const palette = useCodePalette();
  const metrics = LINE_METRICS.sm;
  const card = {
    overflow: 'hidden' as const,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    boxShadow: palette.shadow,
  };
  const padding = { paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10 };

  if (typeof children === 'string' && !style && Object.keys(rest).length === 0) {
    return (
      <View style={[card, containerStyle]}>
        <CodeLines code={children} language={language} lineNumbers={lineNumbers} size="sm" style={padding} />
      </View>
    );
  }

  return (
    <View style={[card, padding, containerStyle]}>
      <RNText
        {...rest}
        style={[
          {
            fontFamily: MONO_FAMILY,
            fontSize: metrics.fontSize,
            lineHeight: metrics.lineHeight,
            color: palette.plain,
          },
          style,
        ]}>
        {children}
      </RNText>
    </View>
  );
};

export const Pre = memo(PreComponent);
Pre.displayName = 'Pre';
