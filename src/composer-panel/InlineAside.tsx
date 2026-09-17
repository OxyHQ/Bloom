import React from 'react';

import { Text } from '../typography';
import { IS_WEB } from './web-hooks';

/**
 * A muted run inside a row's single truncating line — a
 * `<span class="ml-1.5 text-text-secondary">`. On web the nested span keeps the
 * 6px inline margin; native nested text has no margin, so a space stands in.
 */
export function InlineAside({ color, children }: { color: string; children: string }) {
  return (
    <Text variant="body-medium" style={IS_WEB ? { marginLeft: 6, color } : { color }}>
      {IS_WEB ? children : ` ${children}`}
    </Text>
  );
}
