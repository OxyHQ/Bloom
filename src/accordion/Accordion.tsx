import React, {
  memo,
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type LayoutChangeEvent,
  StyleSheet,
  type TextStyle,
} from 'react-native';

import { RiArrowDownSLine as ChevronBottomIcon } from '../icons/remix/RiArrowDownSLine';
import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { DISABLED_OPACITY, space } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { styled } from 'react-native-css';
import { AccordionContext, AccordionItemContext } from './context';
import { useAccordionState, useAccordionItem, useAccordionMotion } from './use-accordion';
import type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from './types';

// ---- Accordion Root ----

const AccordionComponent: React.FC<AccordionProps> = ({
  value,
  onValueChange,
  type = 'single',
  transition,
  children,
  style,
  testID,
}) => {
  const contextValue = useAccordionState({ value, onValueChange, type, transition, children });

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
  const itemContext = useAccordionItem(value, disabled);
  const theme = useTheme();

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

/** The trigger's label box: fills the row, sized from its content (`flexBasis: 'auto'`). */
const TRIGGER_LABEL_STYLE = { flexGrow: 1, flexShrink: 1 } as const;

const AccordionTriggerComponent: React.FC<AccordionTriggerProps> = ({
  children,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const { toggle } = useContext(AccordionContext);
  const { value, isExpanded, disabled, triggerId, contentId } = useContext(AccordionItemContext);
  const rotateAnim = useAccordionMotion(isExpanded, 'trigger', SUPPORTS_NATIVE_DRIVER);
  const resolved = StyleSheet.flatten(style) as TextStyle | undefined;
  const callerText: TextStyle = {};
  for (const key of ['color', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing'] as const) {
    if (resolved?.[key] !== undefined) Object.assign(callerText, { [key]: resolved[key] });
  }
  // Drive press-opacity via state, not Pressable's function-form `style`,
  // which NativeWind v4's css-interop swallows (dropping the trigger's base
  // layout: flexDirection, padding, gap).
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

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
      nativeID={triggerId}
      {...{ 'aria-controls': contentId }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: space.md,
          paddingHorizontal: space.xs,
          gap: space.sm,
          opacity: disabled ? DISABLED_OPACITY : pressed ? 0.7 : 1,
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
      {/* Grow into a full-width trigger, but measure at the label's natural
          width. RN's `flex: 1` is `flexBasis: 0`, and in a shrink-wrapped
          trigger (`alignSelf: 'center'`) Yoga then sized the label at its
          MINIMUM content width: "Having trouble?" wrapped to two lines on
          Android while web (max-content sizing) kept it on one. */}
      <View testID="accordion-trigger-label" style={TRIGGER_LABEL_STYLE}>
        {typeof children === 'string' ? (
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: '600',
                color: theme.colors.text,
              },
              callerText,
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

const AccordionContentComponent: React.FC<AccordionContentProps & { contentStyle?: AccordionContentProps['style'] }> = ({
  children,
  style,
  contentStyle,
}) => {
  const { isExpanded, contentId, triggerId } = useContext(AccordionItemContext);
  const heightAnim = useAccordionMotion(isExpanded, 'content', false);
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
      nativeID={contentId}
      {...{ 'aria-labelledby': triggerId }}
      aria-hidden={!isExpanded}
      pointerEvents={isExpanded ? 'auto' : 'none'}
      accessibilityElementsHidden={!isExpanded}
      importantForAccessibility={isExpanded ? 'auto' : 'no-hide-descendants'}
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
        style={[{ paddingBottom: space.md, paddingLeft: space.xs, paddingRight: space.xs }, contentStyle]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

export const Accordion = memo(styled(AccordionComponent, { className: 'style' }));
Accordion.displayName = 'Accordion';

export const AccordionItem = memo(styled(AccordionItemComponent, { className: 'style' }));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = memo(styled(AccordionTriggerComponent, { className: 'style' }));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = memo(styled(AccordionContentComponent, { className: 'style', contentClassName: 'contentStyle' }));
AccordionContent.displayName = 'AccordionContent';
