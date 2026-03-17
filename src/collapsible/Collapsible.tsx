import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { CollapsibleProps } from './types';

const CollapsibleComponent: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  chevronIcon,
  style,
  titleStyle,
  testID,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const theme = useTheme();

  return (
    <View style={style} testID={testID}>
      <TouchableOpacity
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {chevronIcon ?? (
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.textSecondary,
              transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
            }}
          >
            ›
          </Text>
        )}
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text,
              flex: 1,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
      {isOpen && children}
    </View>
  );
};

export const Collapsible = memo(CollapsibleComponent);
Collapsible.displayName = 'Collapsible';
