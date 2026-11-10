import React, { createContext, useContext, memo } from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { fontSize } from '../styles/tokens';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Card } from '../card';
import { Collapsible } from '../collapsible/Collapsible';
import { Divider } from '../divider';
import { RiArrowRightSLine as ChevronRightIcon } from '../icons/remix/RiArrowRightSLine';
import { BloomScope } from '../appearance/BloomScope';
import { useBloomContentDensity } from '../appearance/context';
import type { BloomContentDensity } from '../appearance/types';
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

/**
 * Each density's row geometry. `compact` is a desktop form's, as a Mac's System
 * Settings draws its groups: a 36-point row (a mini switch or a small control
 * in it), the text inset 10 from the group's edge, a small icon, and the hairline
 * between rows inset at the text.
 */
export const GROUPED_SECTION_GEOMETRY = {
  comfortable: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 52, gap: 12, icon: 28 },
  compact: { paddingHorizontal: 10, paddingVertical: 6, minHeight: 36, gap: 8, icon: 20 },
} as const satisfies Record<BloomContentDensity, Record<string, number>>;

/** Where a compact separator starts: at the text of the row above it. */
function textInset(node: React.ReactNode): number {
  const { paddingHorizontal, icon, gap } = GROUPED_SECTION_GEOMETRY.compact;
  if (
    !React.isValidElement<Partial<GroupedSectionItemProps>>(node) ||
    node.type !== GroupedSectionItem
  ) {
    return paddingHorizontal;
  }
  if (node.props.leftInset !== undefined) return node.props.leftInset;
  return node.props.icon ? paddingHorizontal + icon + gap : paddingHorizontal;
}

const REVEAL_TRANSITION = {
  duration: 320,
  easing: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
interface RowsContextValue {
  separator: NonNullable<GroupedSectionProps['separator']>;
  density: BloomContentDensity;
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
  let previous: React.ReactNode = null;
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
    const above = previous;
    hasPrevious = true;
    previous = node;
    return (
      <React.Fragment key={key}>
        {separated ? (
          context.separator === 'space' ? (
            <View
              testID="grouped-section-gap"
              style={{ height: 2, backgroundColor: context.parentFill }}
            />
          ) : context.separator === 'line' ? (
            <Divider
              testID="grouped-section-divider"
              style={
                context.density === 'compact'
                  ? [styles.hairline, { marginStart: textInset(above) }]
                  : styles.divider
              }
            />
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
  content: customContent,
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
  const compact = useBloomContentDensity() === 'compact';
  const hasChevron = showChevron ?? Boolean(onPress);
  const titleColor = destructive ? theme.colors.error : theme.colors.text;
  const isDisabled = disabled || accessibilityState?.disabled === true;
  const rowState = { ...accessibilityState, disabled: isDisabled };
  const pressedOpacity = isDisabled ? 1 : 0.6;
  // Drive press-opacity via state, not Pressable's function-form `style`,
  // which NativeWind v4's css-interop swallows.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const role = accessibilityRole ?? (onPress ? 'button' : undefined);
  const label = accessibilityLabel ?? title;
  // What the row's value says, read with its name ("Version, 0.1") rather than as loose text
  // after it: an assistive technology reads an accessible row as one element, its children's
  // text included in none of it.
  // As `aria-valuetext`, which React Native folds into `accessibilityValue` and the web reads.
  const spokenValue = value || undefined;
  // A row without a press that holds a control of its own (a switch, a select) is no element:
  // its title and description are read as text and the control by its own name. Without one it
  // is one element, its title its name and its value its value, never a role-less container
  // named like its title with the same title read again inside it.
  const staticElement = !onPress && !rightElement && customContent === undefined;

  const content = (
    <View
      style={[
        styles.itemContainer,
        compact ? styles.itemContainerCompact : undefined,
        leftInset !== undefined ? { paddingLeft: leftInset } : undefined,
      ]}
      testID="settings-list-item-content"
      data-left-inset={leftInset}
    >
      {icon ? (
        <View style={[styles.iconContainer, compact ? styles.iconContainerCompact : undefined]}>
          {icon}
        </View>
      ) : null}

      {customContent !== undefined ? (
        <View style={styles.textContainer}>{customContent}</View>
      ) : (
        <>
          <View style={styles.textContainer}>
            <Text
              variant={compact ? 'body-regular' : undefined}
              style={[compact ? undefined : styles.title, { color: titleColor }]}
              numberOfLines={titleNumberOfLines === 0 ? undefined : titleNumberOfLines}
            >
              {title}
            </Text>
            {description ? (
              <Text
                variant={compact ? 'caption-1-regular' : 'body-2-regular'}
                style={{ color: theme.colors.textSecondary }}
                numberOfLines={descriptionLines === 0 ? undefined : descriptionLines}
              >
                {description}
              </Text>
            ) : null}
          </View>

          {value ? (
            <Text
              variant={compact ? 'body-regular' : 'body-2-regular'}
              style={{ color: theme.colors.textSecondary }}
              numberOfLines={1}
            >
              {value}
            </Text>
          ) : null}
        </>
      )}

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
        aria-valuetext={spokenValue}
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
      collapsable={false}
      // Native only: react-native-web reads `accessible` as a tab stop, which a static row is not.
      accessible={Platform.OS === 'web' ? undefined : staticElement}
      accessibilityRole={role}
      accessibilityLabel={staticElement ? label : accessibilityLabel}
      aria-valuetext={staticElement ? spokenValue : undefined}
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
  density: densityProp,
  radius: radiusProp,
  separator: separatorProp,
}) {
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const density = useBloomContentDensity(densityProp);
  const compact = density === 'compact';
  const radius = radiusProp ?? (compact ? 'radius-12' : 'radius-28');
  const separator = separatorProp ?? (compact ? 'line' : 'space');
  const backgroundColor =
    variant === 'filled'
      ? theme.colors.backgroundSecondary
      : variant === 'plain'
        ? theme.colors.card
        : layer.fill;

  return (
    <View style={[compact ? styles.groupContainerCompact : styles.groupContainer, style]}>
      {title ? (
        compact ? (
          // A desktop form's section title: the headline style (bold body), in the label's colour,
          // as it is written (Title Case in English), aligned with the rows' text.
          <Text
            variant="body-bold"
            style={[styles.groupTitleCompact, { color: theme.colors.text }]}
          >
            {title}
          </Text>
        ) : (
          <Text
            variant="caption-2-semibold"
            style={[styles.groupTitle, { color: theme.colors.textSecondary }]}
          >
            {title}
          </Text>
        )
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
        {/* An explicit density reaches the rows the section holds, whatever scope is above it. */}
        <BloomScope contentDensity={densityProp}>
          {renderRows(children, {
            separator,
            density,
            parentFill: layer.parentFill,
            hasPrevious: false,
          })}
        </BloomScope>
      </Card>

      {footer ? (
        <Text
          variant="caption-1-regular"
          style={[
            compact ? styles.groupFooterCompact : styles.groupFooter,
            { color: compact ? theme.colors.textSecondary : theme.colors.textTertiary },
          ]}
        >
          {footer}
        </Text>
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
  itemContainerCompact: {
    paddingLeft: GROUPED_SECTION_GEOMETRY.compact.paddingHorizontal,
    paddingRight: GROUPED_SECTION_GEOMETRY.compact.paddingHorizontal,
    paddingVertical: GROUPED_SECTION_GEOMETRY.compact.paddingVertical,
    minHeight: GROUPED_SECTION_GEOMETRY.compact.minHeight,
    gap: GROUPED_SECTION_GEOMETRY.compact.gap,
  },
  iconContainer: {
    minWidth: 28,
    minHeight: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerCompact: {
    minWidth: GROUPED_SECTION_GEOMETRY.compact.icon,
    minHeight: GROUPED_SECTION_GEOMETRY.compact.icon,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  // The row label: `body-medium`'s 20 line and weight at the 15px size step.
  title: {
    ...TYPE_SCALE['body-medium'],
    fontSize: fontSize.md,
  },
  disabled: {
    opacity: 0.5,
  },

  // Group
  groupContainer: {
    marginBottom: 16,
  },
  // `caption-2-semibold`, tracked wider for its capitals.
  groupTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  groupFooter: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  // Compact: no outer margin (the page's stack sets the space between sections, so the two never
  // add up), the title and footer aligned with the rows' text.
  groupContainerCompact: {},
  groupTitleCompact: {
    paddingHorizontal: GROUPED_SECTION_GEOMETRY.compact.paddingHorizontal,
    paddingBottom: 6,
  },
  groupFooterCompact: {
    paddingHorizontal: GROUPED_SECTION_GEOMETRY.compact.paddingHorizontal,
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
  // Compact: the hairline between rows, from the text of the row above to the group's edge less
  // the rows' inset, as a Mac's grouped form draws it. `marginStart` is set per row.
  hairline: {
    marginEnd: GROUPED_SECTION_GEOMETRY.compact.paddingHorizontal,
    width: 'auto',
    opacity: 0.3,
  },
});
