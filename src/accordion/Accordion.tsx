import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
  AccordionType,
} from './types';

// ---- Context ----

interface AccordionContextValue {
  expandedValues: Set<string>;
  toggle: (value: string) => void;
  type: AccordionType;
}

const AccordionContext = createContext<AccordionContextValue>({
  expandedValues: new Set(),
  toggle: () => {},
  type: 'single',
});

interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
  disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue>({
  value: '',
  isExpanded: false,
  disabled: false,
});

// ---- Accordion Root ----

const AccordionComponent: React.FC<AccordionProps> = ({
  value,
  onValueChange,
  type = 'single',
  children,
  style,
  testID,
}) => {
  const expandedValues = useMemo(() => {
    if (value == null) return new Set<string>();
    if (Array.isArray(value)) return new Set(value);
    return new Set([value]);
  }, [value]);

  const toggle = useCallback(
    (itemValue: string) => {
      if (type === 'single') {
        const next = expandedValues.has(itemValue) ? undefined : itemValue;
        onValueChange(next);
      } else {
        const next = new Set(expandedValues);
        if (next.has(itemValue)) {
          next.delete(itemValue);
        } else {
          next.add(itemValue);
        }
        onValueChange(Array.from(next));
      }
    },
    [type, expandedValues, onValueChange],
  );

  const contextValue = useMemo(
    () => ({ expandedValues, toggle, type }),
    [expandedValues, toggle, type],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <View style={style} testID={testID}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
};

// ---- Accordion Item ----

const AccordionItemComponent: React.FC<AccordionItemProps> = ({
  value,
  children,
  disabled = false,
  style,
}) => {
  const { expandedValues } = useContext(AccordionContext);
  const isExpanded = expandedValues.has(value);
  const theme = useTheme();

  const itemContext = useMemo(
    () => ({ value, isExpanded, disabled }),
    [value, isExpanded, disabled],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <View
        style={[
          {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
          },
          style,
        ]}
      >
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
};

// ---- Accordion Trigger ----

const AccordionTriggerComponent: React.FC<AccordionTriggerProps> = ({
  children,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const { toggle } = useContext(AccordionContext);
  const { value, isExpanded, disabled } = useContext(AccordionItemContext);
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [isExpanded, rotateAnim]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      toggle(value);
    }
  }, [value, disabled, toggle]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: space.md,
          paddingHorizontal: space.xs,
          gap: space.sm,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded, disabled }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: '600',
                color: theme.colors.text,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            lineHeight: 18,
          }}
        >
          {'\u25BE'}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ---- Accordion Content ----

const AccordionContentComponent: React.FC<AccordionContentProps> = ({
  children,
  style,
}) => {
  const { isExpanded } = useContext(AccordionItemContext);
  const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      ...animation.spring.gentle,
    }).start();
  }, [isExpanded, heightAnim]);

  const opacity = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // reasonable max; content will use its natural height
  });

  return (
    <Animated.View
      style={[
        {
          overflow: 'hidden',
          opacity,
          maxHeight,
        },
        style,
      ]}
    >
      <View style={{ paddingBottom: space.md, paddingHorizontal: space.xs }}>
        {children}
      </View>
    </Animated.View>
  );
};

export const Accordion = memo(AccordionComponent);
Accordion.displayName = 'Accordion';

export const AccordionItem = memo(AccordionItemComponent);
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = memo(AccordionTriggerComponent);
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = memo(AccordionContentComponent);
AccordionContent.displayName = 'AccordionContent';
