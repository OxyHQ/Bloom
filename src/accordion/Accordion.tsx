import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon } from '../icons/Chevron';
import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { animation, borderRadius, space } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
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
  // Drive press-opacity via state, not Pressable's function-form `style`,
  // which NativeWind v4's css-interop swallows (dropping the trigger's base
  // layout: flexDirection, padding, gap).
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
      style={[
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
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      // `aria-expanded` rather than `accessibilityState`, which react-native-web
      // drops entirely. React Native folds this back into `accessibilityState`,
      // so it is the one spelling both platforms read. `disabled` travels on the
      // `disabled` prop above.
      aria-expanded={isExpanded}
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
        <ChevronBottomIcon size="sm" fill={theme.colors.textSecondary} />
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
  // The content's own height, measured. The reveal used to interpolate to a
  // hardcoded 500 ("reasonable max"), which is not a max at all: `overflow:
  // hidden` above it meant anything taller was CLIPPED, silently, with no error
  // and no scrollbar — an accordion holding a form or a paragraph of prose just
  // lost its bottom. The content still lays out at its natural height inside the
  // clip, so `onLayout` reports the real one whether the item is open or shut.
  const [contentHeight, setContentHeight] = useState(0);
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    // Sub-pixel churn would re-render on every frame of the spring.
    setContentHeight((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  }, []);

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
    outputRange: [0, contentHeight],
  });

  return (
    <Animated.View
      style={[
        {
          overflow: 'hidden',
          opacity,
          // Before the first measurement an OPEN item must not be clipped to
          // zero, and a SHUT one must not flash open — so the unmeasured frame
          // takes the answer its state already implies, and every frame after
          // that is driven by the real height.
          maxHeight: contentHeight === 0 && isExpanded ? undefined : maxHeight,
        },
        style,
      ]}
    >
      <View
        onLayout={handleContentLayout}
        style={{ paddingBottom: space.md, paddingHorizontal: space.xs }}
      >
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
