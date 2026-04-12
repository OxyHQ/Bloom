import React, { memo, useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';

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

  const handleToggle = useCallback(() => {
    const nextOpen = !isOpen;

    // Animate chevron rotation in the event handler, not via useEffect
    Animated.spring(chevronAnim, {
      toValue: nextOpen ? 1 : 0,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();

    LayoutAnimation.configureNext({
      duration: animation.duration.normal,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });

    setIsOpen(nextOpen);
  }, [isOpen, chevronAnim]);

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
        style={styles.trigger}
      >
        {chevronIcon ?? (
          <Animated.Text
            style={[
              styles.chevron,
              { color: theme.colors.textSecondary, transform: [{ rotate: chevronRotation }] },
            ]}
          >
            ›
          </Animated.Text>
        )}
        <Text
          style={[
            styles.title,
            { color: theme.colors.text },
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

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  chevron: {
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
