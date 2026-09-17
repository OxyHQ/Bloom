import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Rating } from '../rating';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LISTING_HEADER_WIDE_MIN_WIDTH } from './constants';
import { IS_WEB, LISTING_DETAILS_CSS, LISTING_DETAILS_STYLE_ID, resolveListingPalette, type ListingPalette } from './shared';
import { webDataSet as webData } from '../styles/web-data';
import type { ListingHeaderActionProps, ListingHeaderProps } from './types';
import { useContainerWidth } from '../hooks/use-container-width';

/**
 * The title block of a listing page.
 *
 *   title      title-1-semibold (`size="medium"`: title-2-semibold), a heading
 *   subtitle   body-regular, text-secondary; parts joined with " · "
 *   meta row   badge · Rating (medium) · reviews link · location link,
 *              body-medium, text-primary, underlined; "·" separators in
 *              text-secondary; wraps
 *   actions    beside the title from 640 wide, under the meta row below it
 *
 * The links are real pressables named by their text; without a handler they
 * draw as plain text.
 */

function Separator({ palette }: { palette: ListingPalette }) {
  return (
    <Text
      variant="body-regular"
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={{ color: palette.textSecondary }}
    >
      ·
    </Text>
  );
}

/**
 * `Button variant="link"` with the reading tone and the underline at rest —
 * what this drew by hand before `linkTone="text"` / `underline="rest"` existed.
 * Without a handler it is not a control at all, so it stays plain text.
 */
function InlineLink({
  label,
  onPress,
  palette,
  testID,
}: {
  label: string;
  onPress?: () => void;
  palette: ListingPalette;
  testID?: string;
}) {
  if (!onPress) {
    return (
      <Text variant="body-medium" style={{ color: palette.text }} testID={testID}>
        {label}
      </Text>
    );
  }
  return (
    <Button
      variant="link"
      linkTone="text"
      underline="rest"
      size="small"
      textVariant="body-medium"
      accessibilityRole={IS_WEB ? 'link' : 'button'}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
    >
      {label}
    </Button>
  );
}

function ListingHeaderActionComponent({
  label,
  icon: Icon,
  onPress,
  pressed,
  accessibilityLabel,
  iconOnly = false,
  style,
  testID,
}: ListingHeaderActionProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const base: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingLeft: iconOnly ? 8 : 10,
    paddingRight: iconOnly ? 8 : 12,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? palette.hover : 'transparent',
    '--bloom-listing-ring': palette.ring,
  };
  return (
    <Pressable
      {...webData({ bloomListingPress: '' })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      {...(pressed === undefined
        ? null
        : { 'aria-pressed': pressed, accessibilityState: { selected: pressed } })}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={[base, style]}
      testID={testID}
    >
      {Icon ? <Icon width={16} height={16} fill={palette.text} /> : null}
      {iconOnly ? null : (
        <Text variant="body-semibold" style={{ color: palette.text, textDecorationLine: 'underline' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export const ListingHeaderAction = memo(ListingHeaderActionComponent);
ListingHeaderAction.displayName = 'ListingHeaderAction';

function ListingHeaderComponent({
  title,
  size = 'large',
  headingLevel = 1,
  subtitle,
  rating,
  reviewsLabel,
  onPressReviews,
  location,
  onPressLocation,
  badge,
  actions,
  style,
  testID,
}: ListingHeaderProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();
  const wide = width != null && width >= LISTING_HEADER_WIDE_MIN_WIDTH;

  const subtitleText = Array.isArray(subtitle) ? subtitle.filter(Boolean).join(' · ') : subtitle;

  const meta: React.ReactNode[] = [];
  if (badge) meta.push(<React.Fragment key="badge">{badge}</React.Fragment>);
  if (rating !== undefined) {
    meta.push(<Rating key="rating" value={rating} testID={testID ? `${testID}-rating` : undefined} />);
  }
  if (reviewsLabel) {
    meta.push(
      <InlineLink
        key="reviews"
        label={reviewsLabel}
        onPress={onPressReviews}
        palette={palette}
        testID={testID ? `${testID}-reviews` : undefined}
      />,
    );
  }
  if (location) {
    meta.push(
      <InlineLink
        key="location"
        label={location}
        onPress={onPressLocation}
        palette={palette}
        testID={testID ? `${testID}-location` : undefined}
      />,
    );
  }

  const titleNode = (
    <Text
      role="heading"
      aria-level={headingLevel}
      variant={size === 'large' ? 'title-1-semibold' : 'title-2-semibold'}
      style={{ color: palette.text }}
      testID={testID ? `${testID}-title` : undefined}
    >
      {title}
    </Text>
  );

  const actionsNode = actions ? (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: wide ? 0 : -10 }}
      testID={testID ? `${testID}-actions` : undefined}
    >
      {actions}
    </View>
  ) : null;

  return (
    <View onLayout={onLayout} style={[{ width: '100%', gap: 8 }, style]} testID={testID}>
      {wide && actionsNode ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}
          testID={testID ? `${testID}-title-row` : undefined}
        >
          <View style={{ flex: 1, minWidth: 0 }}>{titleNode}</View>
          {actionsNode}
        </View>
      ) : (
        titleNode
      )}
      {subtitleText ? (
        <Text
          variant="body-regular"
          style={{ color: palette.textSecondary }}
          testID={testID ? `${testID}-subtitle` : undefined}
        >
          {subtitleText}
        </Text>
      ) : null}
      {meta.length > 0 ? (
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}
          testID={testID ? `${testID}-meta` : undefined}
        >
          {meta.flatMap((node, index) =>
            index === 0 ? [node] : [<Separator key={`sep-${index}`} palette={palette} />, node],
          )}
        </View>
      ) : null}
      {!wide && actionsNode}
    </View>
  );
}

export const ListingHeader = memo(ListingHeaderComponent);
ListingHeader.displayName = 'ListingHeader';
