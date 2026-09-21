import React, { memo, useMemo, type ComponentType, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { IconCircle } from '../icon-circle';
import type { Props as IconProps } from '../icons/shared';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EMPTY_STATE_ACTION_GAP, EMPTY_STATE_GEOMETRY } from './constants';
import { joinEmptyStateName, resolveEmptyStatePaint } from './shared';
import type { EmptyStateAction, EmptyStateProps } from './types';

/**
 * Nothing to show, said once.
 *
 *   mark      the glyph in the GRAPHICAL rung (`textGraphical`, the stop the
 *             ladder sizes for a line rather than for text, so it clears 3:1 on
 *             whatever is behind it), or `IconCircle`'s tinted disc, or an
 *             arbitrary `illustration`
 *   title     headline-semibold (panel: body-medium), `heading` level 3
 *   line      body-regular secondary (panel: body-2-regular), capped at 360 so
 *             a centred paragraph does not run the width of a 1440 page
 *   children  stretched full width, laid out by whatever was passed
 *   actions   up to two, primary then secondary, wrapping
 *   footer    centred, under the actions
 *
 * The whole block is ONE named `group`: a screen reader reaching an empty list
 * should be told the situation, not handed a heading, a paragraph and a button
 * with nothing joining them.
 *
 * Bloom had no such family and a dozen components had each drawn their own —
 * five of them the same glyph-over-headline-over-line, at five different
 * paddings, with the two text slots spelled `emptyTitle`/`emptyDescription`,
 * `emptyMessage`, `emptyQueueHint`, `emptyLabel`, `emptyText` and
 * `noResultsLabel`. This is the one shape; migrating those call sites is a
 * separate change, and this family is designed to cover them as they stand.
 */
function EmptyStateComponent({
  icon: Icon,
  media = 'glyph',
  illustration,
  title,
  description,
  action,
  secondaryAction,
  children,
  footer,
  variant = 'comfortable',
  minHeight,
  accessibilityLabel,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveEmptyStatePaint(theme, surface), [theme, surface]);
  const g = EMPTY_STATE_GEOMETRY[variant];
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  // `illustration` wins, and it is read for PRESENCE rather than truthiness so
  // an explicit `illustration={null}` draws no mark at all even with an `icon`
  // set by a default two levels up.
  const mark: ReactNode =
    illustration !== undefined ? (
      illustration
    ) : Icon ? (
      media === 'circle' ? (
        // `IconCircle` asks for an icon's FULL props (it sets `size`), which is
        // narrower than `BloomIconComponent`'s three optional ones. Every Bloom
        // glyph satisfies both; this is the boundary between the two spellings,
        // and the only place in the family that needs to know there are two.
        <IconCircle icon={Icon as ComponentType<IconProps>} size={g.circle} />
      ) : (
        // Hidden from assistive technology: the glyph repeats what the title
        // says, and an unnamed image between a heading and its paragraph is a
        // stop that announces nothing. The hiding goes on a WRAPPER — an icon
        // component takes width, height and fill, and drops anything else.
        <View aria-hidden importantForAccessibility="no-hide-descendants">
          <Icon width={g.glyph} height={g.glyph} fill={paint.textGraphical} />
        </View>
      )
    ) : null;

  const renderAction = (a: EmptyStateAction, kind: 'primary' | 'secondary') => (
    <Button
      variant={kind}
      size={variant === 'compact' ? 'small' : 'medium'}
      onPress={a.onPress}
      disabled={a.disabled}
      loading={a.loading}
      leadingIcon={a.icon}
      accessibilityLabel={a.accessibilityLabel}
      testID={a.testID ?? id(kind === 'primary' ? 'action' : 'secondary-action')}
    >
      {a.label}
    </Button>
  );

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel ?? joinEmptyStateName([title, description])}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: g.gap,
          paddingTop: g.paddingVertical,
          paddingBottom: g.paddingVertical,
          ...(minHeight != null ? { minHeight } : null),
        },
        style,
      ]}
    >
      {mark != null ? (
        <View testID={id('mark')} style={{ alignItems: 'center' }}>
          {mark}
        </View>
      ) : null}

      {title != null || description != null ? (
        <View style={{ alignItems: 'center', gap: g.textGap, maxWidth: g.maxWidth }}>
          {title != null ? (
            <Text
              variant={g.title}
              role="heading"
              aria-level={3}
              testID={id('title')}
              style={{ color: paint.text, textAlign: 'center' }}
            >
              {title}
            </Text>
          ) : null}
          {description != null ? (
            <Text
              variant={g.description}
              testID={id('description')}
              style={{ color: paint.textSecondary, textAlign: 'center' }}
            >
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}

      {children != null ? (
        // `alignSelf: 'stretch'` and `minWidth: 0`: what goes here is a strip, a
        // fact box or a list, none of which is centred text — and a flex child
        // without the floor takes its content's min-content width as the
        // block's own, which is how a nowrap line inside one widens the page.
        <View testID={id('content')} style={{ alignSelf: 'stretch', minWidth: 0 }}>
          {children}
        </View>
      ) : null}

      {action || secondaryAction ? (
        <View
          testID={id('actions')}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: EMPTY_STATE_ACTION_GAP,
          }}
        >
          {action ? renderAction(action, 'primary') : null}
          {secondaryAction ? renderAction(secondaryAction, 'secondary') : null}
        </View>
      ) : null}

      {footer != null ? (
        <View testID={id('footer')} style={{ alignItems: 'center' }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const EmptyState = memo(EmptyStateComponent);
EmptyState.displayName = 'EmptyState';
