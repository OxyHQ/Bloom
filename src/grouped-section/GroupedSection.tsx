import React, { createContext, useContext, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Card } from '../card';
import { Collapsible } from '../collapsible/Collapsible';
import { Divider } from '../divider';
import { RiArrowRightSLine as ChevronRightIcon } from '../icons/remix/RiArrowRightSLine';
import { GROUPED_SECTION_TEST_ID } from './surface';
import type {
  GroupedSectionItemProps,
  GroupedSectionProps,
  GroupedSectionCollapseProps,
  GroupedSectionDividerProps,
} from './types';

/** Fragments are structural, not painted rows; keep their key path stable. */
function sectionRows(
  children: React.ReactNode,
  parent = '',
): Array<{ key: string; node: React.ReactNode }> {
  return React.Children.toArray(children).flatMap((node, index) => {
    const key = JSON.stringify([parent, React.isValidElement(node) ? node.key : index]);
    if (
      React.isValidElement<{ children?: React.ReactNode }>(node) &&
      node.type === React.Fragment
    ) {
      return sectionRows(node.props.children, key);
    }
    return [{ key, node }];
  });
}

const REVEAL_TRANSITION = {
  duration: 320,
  easing: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
interface RowsContextValue {
  separator: NonNullable<GroupedSectionProps['separator']>;
  parentFill: string;
  hasPrevious: boolean;
}
const RowsContext = createContext<RowsContextValue | null>(null);

/** Measured row reveal using the same Collapsible primitive as UsageCard. */
export function GroupedSectionCollapse({
  children,
  transition = REVEAL_TRANSITION,
  ...props
}: GroupedSectionCollapseProps) {
  const context = useContext(RowsContext);
  if (!context) throw new Error('GroupedSectionCollapse must be inside GroupedSection');
  return (
    <Collapsible {...props} transition={transition}>
      {renderRows(children, context)}
    </Collapsible>
  );
}

function renderRows(children: React.ReactNode, context: RowsContextValue): React.ReactNode {
  let hasPrevious = context.hasPrevious;
  return sectionRows(children).map(({ key, node }) => {
    if (
      React.isValidElement<GroupedSectionCollapseProps>(node) &&
      node.type === GroupedSectionCollapse
    ) {
      const value = { ...context, hasPrevious };
      hasPrevious ||= node.props.open && sectionRows(node.props.children).length > 0;
      return (
        <RowsContext.Provider key={key} value={value}>
          {node}
        </RowsContext.Provider>
      );
    }
    const separated = hasPrevious;
    hasPrevious = true;
    return (
      <React.Fragment key={key}>
        {separated ? (
          context.separator === 'space' ? (
            <View
              testID="grouped-section-gap"
              style={{ height: 2, backgroundColor: context.parentFill }}
            />
          ) : context.separator === 'line' ? (
            <Divider testID="grouped-section-divider" style={styles.divider} />
          ) : null
        ) : null}
        <View testID="grouped-section-row" style={{ backgroundColor: 'transparent' }}>
          {node}
        </View>
      </React.Fragment>
    );
  });
}

// ── GroupedSectionItem ────────────────────────────────────────────

export const GroupedSectionItem = memo<GroupedSectionItemProps>(function GroupedSectionItem({
  icon,
  title,
  titleNumberOfLines = 1,
  description,
  descriptionLines = 2,
  value,
  rightElement,
  showChevron,
  destructive = false,
  onPress,
  disabled = false,
  accessibilityState,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  leftInset,
}) {
  const theme = useTheme();
  const hasChevron = showChevron ?? Boolean(onPress);
  const titleColor = destructive ? theme.colors.error : theme.colors.text;
  const isDisabled = disabled || accessibilityState?.disabled === true;
  const rowState = { ...accessibilityState, disabled: isDisabled };
  const pressedOpacity = isDisabled ? 1 : 0.6;
  // Drive press-opacity via state, not Pressable's function-form `style`,
  // which NativeWind v4's css-interop swallows.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const role = accessibilityRole ?? (onPress ? 'button' : 'none');
  const label = accessibilityLabel ?? title;

  const content = (
    <View
      style={[
        styles.itemContainer,
        leftInset !== undefined ? { paddingLeft: leftInset } : undefined,
      ]}
      testID="settings-list-item-content"
      data-left-inset={leftInset}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}

      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={titleNumberOfLines === 0 ? undefined : titleNumberOfLines}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={descriptionLines === 0 ? undefined : descriptionLines}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text style={[styles.value, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {rightElement}

      {hasChevron ? <ChevronRightIcon size="sm" fill={theme.colors.textTertiary} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : onPressIn}
        onPressOut={isDisabled ? undefined : onPressOut}
        disabled={isDisabled}
        android_ripple={{ color: theme.colors.border }}
        accessibilityRole={role}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={rowState}
        testID={testID}
        aria-selected={accessibilityState?.selected}
        aria-busy={accessibilityState?.busy}
        aria-expanded={accessibilityState?.expanded}
        aria-checked={accessibilityState?.checked}
        style={[isDisabled && styles.disabled, pressed && { opacity: pressedOpacity }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      // See the pressable branch above, which gets `aria-disabled` for free
      // from its `disabled` prop. A `View` has no such prop, and
      // react-native-web never reads `accessibilityState`.
      accessibilityState={rowState}
      testID={testID}
      aria-disabled={isDisabled || undefined}
      aria-selected={accessibilityState?.selected}
      aria-busy={accessibilityState?.busy}
      aria-expanded={accessibilityState?.expanded}
      aria-checked={accessibilityState?.checked}
    >
      {content}
    </View>
  );
});

// ── GroupedSection ───────────────────────────────────────────

export const GroupedSection = memo<GroupedSectionProps>(function GroupedSection({
  title,
  footer,
  children,
  style,
  variant,
  radius = 'radius-28',
  separator = 'space',
}) {
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const backgroundColor =
    variant === 'filled'
      ? theme.colors.backgroundSecondary
      : variant === 'plain'
        ? theme.colors.card
        : layer.fill;

  return (
    <View style={[styles.groupContainer, style]}>
      {title ? (
        <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      ) : null}

      {/*
        No horizontal self-inset: a `GroupedSection` fills its parent's content
        width, so the single horizontal inset comes from the ONE content padding
        the screen/Dialog already applies (the same `px-screen-margin` that pads
        the title/search). A self-margin here double-inset grouped rows on every
        screen that also applies that padding.
      */}
      <Card
        clipContent
        appearance={variant === 'filled' ? 'subtle' : 'solid'}
        elevation="none"
        border="none"
        radius={radius}
        style={{ backgroundColor }}
        testID={GROUPED_SECTION_TEST_ID}
      >
        {renderRows(children, { separator, parentFill: layer.parentFill, hasPrevious: false })}
      </Card>

      {footer ? (
        <Text style={[styles.groupFooter, { color: theme.colors.textTertiary }]}>{footer}</Text>
      ) : null}
    </View>
  );
});

// ── GroupedSectionDivider ─────────────────────────────────────────

export const GroupedSectionDivider = memo<GroupedSectionDividerProps>(
  function GroupedSectionDivider({ inset = 52 }) {
    return <Divider style={[styles.divider, { marginLeft: inset }]} />;
  },
);

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Item
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Longhands, because `leftInset` overrides the left edge with a later
    // `paddingLeft` — and on web react-native-web maps `paddingHorizontal` to
    // the CSS shorthand `padding-inline`, which its atomic sheet ranks above
    // the longhands whatever the style array's order. So `leftInset` was inert
    // on web and correct on native, silently. See the longer note in
    // `item/Item.tsx`, where the mechanism was measured.
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    minHeight: 52,
    gap: 12,
  },
  iconContainer: {
    minWidth: 28,
    minHeight: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 17,
  },
  value: {
    fontSize: 13,
    lineHeight: 17,
  },
  disabled: {
    opacity: 0.5,
  },

  // Group
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  groupFooter: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  // Divider. `Divider` supplies the hairline height and `theme.colors.border`;
  // these are the settings-list specifics on top of it. `width: 'auto'` is
  // load-bearing next to the inset: `Divider`'s own `width: '100%'` would make
  // an inset rule overhang its container by exactly the inset.
  divider: {
    marginLeft: 16,
    width: 'auto',
    opacity: 0.3,
  },
});
