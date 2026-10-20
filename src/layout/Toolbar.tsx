import React from 'react';
import { BloomScope, useBloomAppearance } from '../appearance';
import { TOOLBAR_GEOMETRY } from '../appearance/control-geometry';
import { StyledView as View } from '../styles/styled-primitives';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { ScrollArea } from './ScrollArea';
import type { ToolbarProps } from './types';

/** The scrolling tools and persistent actions share one bounded command row. */
export function Toolbar({
  children,
  actions,
  accessory,
  size: sizeProp,
  style,
  className,
  testID,
}: ToolbarProps) {
  const direction = useDirectionProps();
  const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const geometry = TOOLBAR_GEOMETRY[size];
  return (
    <BloomScope size={size}>
      <View
        {...direction}
        style={[
          {
            minWidth: 0,
            gap: geometry.accessoryGap,
            paddingLeft: geometry.padding,
            paddingRight: geometry.padding,
            paddingTop: geometry.padding,
            paddingBottom: geometry.padding,
          },
          style,
        ]}
        className={className}
        testID={testID}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: geometry.gap }}
        >
          <ScrollArea
            horizontal
            style={{ flex: 1, minWidth: 0 }}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: geometry.gap,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollArea>
          {actions == null ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexShrink: 0,
                gap: geometry.gap,
              }}
            >
              {actions}
            </View>
          )}
        </View>
        {accessory}
      </View>
    </BloomScope>
  );
}
