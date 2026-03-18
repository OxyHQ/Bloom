import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import type { CollapsibleProps } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHEVRON_CLOSED = '0deg';
const CHEVRON_OPEN = '90deg';

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
  const chevronAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();
  }, [isOpen, chevronAnim]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: animation.duration.normal,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setIsOpen((prev) => !prev);
  }, []);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CHEVRON_CLOSED, CHEVRON_OPEN],
  });

  return (
    <View style={style} testID={testID}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {chevronIcon ?? (
          <Animated.Text
            style={{
              fontSize: 16,
              color: theme.colors.textSecondary,
              transform: [{ rotate: chevronRotation }],
            }}
          >
            ›
          </Animated.Text>
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
