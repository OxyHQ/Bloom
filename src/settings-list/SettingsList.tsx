import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import type {
  SettingsListItemProps,
  SettingsListGroupProps,
  SettingsListDividerProps,
} from './types';

// ── Chevron icon (inline to avoid external dependency) ──────────
const Chevron = memo(({ size = 16, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.29 6.71c-.39.39-.39 1.02 0 1.41L13.17 12l-3.88 3.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"
      fill={color}
    />
  </Svg>
));
Chevron.displayName = 'Chevron';

// ── SettingsListItem ────────────────────────────────────────────

export const SettingsListItem = memo<SettingsListItemProps>(function SettingsListItem({
  icon,
  title,
  description,
  value,
  rightElement,
  showChevron,
  destructive = false,
  onPress,
  disabled = false,
}) {
  const theme = useTheme();
  const hasChevron = showChevron ?? Boolean(onPress);
  const titleColor = destructive ? theme.colors.error : theme.colors.text;
  const pressedOpacity = disabled ? 1 : 0.6;

  const content = (
    <View style={styles.itemContainer}>
      {icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : null}

      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          style={[styles.value, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}

      {rightElement}

      {hasChevron ? (
        <Chevron size={16} color={theme.colors.textTertiary} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: theme.colors.border }}
        style={({ pressed }) => [
          disabled && styles.disabled,
          pressed && { opacity: pressedOpacity },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});

// ── SettingsListGroup ───────────────────────────────────────────

export const SettingsListGroup = memo<SettingsListGroupProps>(function SettingsListGroup({
  title,
  footer,
  children,
  style,
}) {
  const theme = useTheme();
  const filteredChildren = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.groupContainer, style]}>
      {title ? (
        <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
      ) : null}

      <View
        style={[
          styles.groupCard,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        {filteredChildren.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < filteredChildren.length - 1 ? (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border, opacity: 0.3 },
                ]}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>

      {footer ? (
        <Text style={[styles.groupFooter, { color: theme.colors.textTertiary }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
});

// ── SettingsListDivider ─────────────────────────────────────────

export const SettingsListDivider = memo<SettingsListDividerProps>(
  function SettingsListDivider({ inset = 52 }) {
    const theme = useTheme();
    return (
      <View
        style={[
          styles.divider,
          { marginLeft: inset, backgroundColor: theme.colors.border, opacity: 0.3 },
        ]}
      />
    );
  }
);

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Item
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    gap: 12,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
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
  groupCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
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

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
