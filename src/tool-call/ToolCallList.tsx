import React from 'react';

import { StyledView } from '../styles/styled-primitives';
import { ToolCallListProvider } from './context';
import type { ToolCallListProps } from './types';

/**
 * A column of `ToolCall`s, 6px apart, announced as a list so a screen reader
 * says "list, 3 items" and each call is one item.
 */
export function ToolCallList({
  accessibilityLabel,
  className,
  style,
  ref,
  testID,
  children,
}: ToolCallListProps) {
  return (
    <ToolCallListProvider value>
      <StyledView
        ref={ref}
        role="list"
        accessibilityLabel={accessibilityLabel}
        className={className}
        style={[{ gap: 6 }, style]}
        testID={testID}
      >
        {children}
      </StyledView>
    </ToolCallListProvider>
  );
}
ToolCallList.displayName = 'ToolCallList';
