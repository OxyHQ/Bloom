import React from 'react';
import { StyledView as View } from '../styles/styled-primitives';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { ScrollArea } from './ScrollArea';
import type { ToolbarProps } from './types';

/** The scrolling tools and persistent actions share one bounded command row. */
export function Toolbar({ children, actions, accessory, style, className, testID }: ToolbarProps) {
  const direction = useDirectionProps();
  return (
    <View
      {...direction}
      style={[{ minWidth: 0, gap: 4, padding: 8 }, style]}
      className={className}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 8 }}>
        <ScrollArea
          horizontal
          style={{ flex: 1, minWidth: 0 }}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollArea>
        {actions == null ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 8 }}>
            {actions}
          </View>
        )}
      </View>
      {accessory}
    </View>
  );
}
