import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  type ViewStyle,
  type TextStyle,
  type LayoutChangeEvent,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import type { TabsProps, TabProps, TabPanelProps, TabsVariant } from './types';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
  variant: 'underline',
});

const TabsBarComponent: React.FC<TabsProps> = ({
  value,
  onValueChange,
  variant = 'underline',
  children,
  style,
  testID,
}) => {
  const theme = useTheme();

  const contextValue = useMemo(
    () => ({ value, onValueChange, variant }),
    [value, onValueChange, variant],
  );

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
    };

    switch (variant) {
      case 'underline':
        base.borderBottomWidth = 1;
        base.borderBottomColor = theme.colors.borderLight;
        break;
      case 'filled':
        base.backgroundColor = theme.colors.backgroundSecondary;
        base.borderRadius = borderRadius.sm;
        base.padding = 2;
        break;
      case 'outlined':
        base.borderWidth = 1;
        base.borderColor = theme.colors.border;
        base.borderRadius = borderRadius.sm;
        base.padding = 2;
        break;
    }

    return base;
  }, [variant, theme]);

  return (
    <TabsContext.Provider value={contextValue}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[containerStyle, style]}
        testID={testID}
      >
        {children}
      </ScrollView>
    </TabsContext.Provider>
  );
};

const TabComponent: React.FC<TabProps> = ({
  value,
  label,
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const { value: selectedValue, onValueChange, variant } = useContext(TabsContext);
  const isSelected = value === selectedValue;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (!disabled) {
      onValueChange(value);
    }
  }, [value, disabled, onValueChange]);

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();
  }, [scaleAnim]);

  const tabStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      gap: space.xs,
    };

    switch (variant) {
      case 'underline':
        if (isSelected) {
          base.borderBottomWidth = 2;
          base.borderBottomColor = theme.colors.primary;
          base.marginBottom = -1; // overlap container border
        }
        break;
      case 'filled':
        if (isSelected) {
          base.backgroundColor = theme.colors.card;
          base.borderRadius = borderRadius.xs + 2;
          base.shadowColor = theme.colors.shadow;
          base.shadowOffset = { width: 0, height: 1 };
          base.shadowOpacity = 0.1;
          base.shadowRadius = 2;
          base.elevation = 1;
        }
        break;
      case 'outlined':
        if (isSelected) {
          base.backgroundColor = theme.colors.primary;
          base.borderRadius = borderRadius.xs + 2;
        }
        break;
    }

    return base;
  }, [variant, isSelected, theme]);

  const labelStyle = useMemo((): TextStyle => {
    const base: TextStyle = {
      fontSize: 14,
      fontWeight: isSelected ? '600' : '500',
    };

    if (variant === 'outlined' && isSelected) {
      base.color = '#fff';
    } else if (isSelected) {
      base.color = theme.colors.primary;
    } else {
      base.color = theme.colors.textSecondary;
    }

    return base;
  }, [variant, isSelected, theme]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[tabStyle, disabled && { opacity: 0.4 }, style]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="tab"
        accessibilityState={{ selected: isSelected, disabled }}
      >
        {icon}
        <Text style={[labelStyle, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const TabPanelComponent: React.FC<TabPanelProps> = ({ value, children, style }) => {
  const { value: selectedValue } = useContext(TabsContext);

  if (value !== selectedValue) return null;

  return <View style={style}>{children}</View>;
};

export const TabsBar = memo(TabsBarComponent);
TabsBar.displayName = 'TabsBar';

export const Tab = memo(TabComponent);
Tab.displayName = 'Tab';

export const TabPanel = memo(TabPanelComponent);
TabPanel.displayName = 'TabPanel';
