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
  Easing,
  ScrollView,
  type LayoutRectangle,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import { borderRadius, space } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import type { TabsProps, TabsTriggerProps, TabsContentProps, TabsVariant } from './types';

type TriggerLayout = Pick<LayoutRectangle, 'x' | 'width'>;

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
  fullWidth: boolean;
  /** A trigger reports its measured position so the shared underline can track it. */
  reportTriggerLayout: (value: string, layout: TriggerLayout) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
  variant: 'underline',
  fullWidth: false,
  reportTriggerLayout: () => {},
});

const TabsBarComponent: React.FC<TabsProps> = ({
  value,
  onValueChange,
  variant = 'underline',
  fullWidth = false,
  children,
  style,
  testID,
}) => {
  const theme = useTheme();
  const isUnderline = variant === 'underline';

  // Shared sliding underline: one indicator that translates + resizes between
  // triggers. Triggers report their measured {x, width}; the container drives
  // these Animated values imperatively (no re-render on measure or slide).
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const triggerLayoutsRef = useRef<Record<string, TriggerLayout>>({});
  const indicatorPlacedRef = useRef(false);

  const moveIndicator = useCallback(
    (target: TriggerLayout, animate: boolean) => {
      if (animate) {
        Animated.parallel([
          Animated.timing(indicatorX, {
            toValue: target.x,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(indicatorWidth, {
            toValue: target.width,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        indicatorX.setValue(target.x);
        indicatorWidth.setValue(target.width);
      }
    },
    [indicatorX, indicatorWidth],
  );

  const reportTriggerLayout = useCallback(
    (tabValue: string, layout: TriggerLayout) => {
      triggerLayoutsRef.current[tabValue] = layout;
      // Snap onto the active trigger the moment it's first measured (mount) or
      // when its size changes — never slide in from the origin.
      if (tabValue === value) {
        moveIndicator(layout, false);
        indicatorPlacedRef.current = true;
      }
    },
    [value, moveIndicator],
  );

  // Slide the indicator to the newly-selected trigger. Syncing an imperative
  // Animated value to the controlled `value` prop is a legitimate effect
  // (external-system sync); the first placement snaps, later changes animate.
  useEffect(() => {
    if (!isUnderline) return;
    const target = triggerLayoutsRef.current[value];
    if (!target) return; // not measured yet — reportTriggerLayout will place it
    moveIndicator(target, indicatorPlacedRef.current);
    indicatorPlacedRef.current = true;
  }, [value, isUnderline, moveIndicator]);

  const contextValue = useMemo(
    () => ({ value, onValueChange, variant, fullWidth, reportTriggerLayout }),
    [value, onValueChange, variant, fullWidth, reportTriggerLayout],
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

  const indicator = isUnderline ? (
    <Animated.View
      pointerEvents="none"
      testID={testID ? `${testID}-indicator` : undefined}
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: 2,
        backgroundColor: theme.colors.primary,
        width: indicatorWidth,
        transform: [{ translateX: indicatorX }],
      }}
    />
  ) : null;

  return (
    <TabsContext.Provider value={contextValue}>
      {fullWidth ? (
        <View style={[containerStyle, style]} testID={testID}>
          {children}
          {indicator}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[containerStyle, style]}
          testID={testID}
        >
          {children}
          {indicator}
        </ScrollView>
      )}
    </TabsContext.Provider>
  );
};

const TabComponent: React.FC<TabsTriggerProps> = ({
  value,
  label,
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const {
    value: selectedValue,
    onValueChange,
    variant,
    fullWidth,
    reportTriggerLayout,
  } = useContext(TabsContext);
  const isSelected = value === selectedValue;
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(0.97);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onValueChange(value);
    }
  }, [value, disabled, onValueChange]);

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
        // Active state is drawn by the shared sliding indicator, not a
        // per-trigger border — nothing to add here.
        break;
      case 'filled':
        if (isSelected) {
          base.backgroundColor = theme.colors.card;
          base.borderRadius = borderRadius.xs + 2;
          // Subtle raise (`shadow-s`) — `boxShadow` on web, RN shadow/elevation on native.
          Object.assign(base, bloomShadowStyle('s'));
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
      base.color = theme.colors.primaryForeground;
    } else if (isSelected) {
      base.color = theme.colors.primary;
    } else {
      base.color = theme.colors.textSecondary;
    }

    return base;
  }, [variant, isSelected, theme]);

  return (
    <Animated.View
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        reportTriggerLayout(value, { x, width });
      }}
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { flex: 1 }]}
    >
      <Pressable
        style={[tabStyle, fullWidth && { flex: 1 }, disabled && { opacity: 0.4 }, style]}
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

const TabPanelComponent: React.FC<TabsContentProps> = ({ value, children, style }) => {
  const { value: selectedValue } = useContext(TabsContext);

  if (value !== selectedValue) return null;

  return <View style={style}>{children}</View>;
};

export const Tabs = memo(TabsBarComponent);
Tabs.displayName = 'Tabs';

export const TabsTrigger = memo(TabComponent);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = memo(TabPanelComponent);
TabsContent.displayName = 'TabsContent';
