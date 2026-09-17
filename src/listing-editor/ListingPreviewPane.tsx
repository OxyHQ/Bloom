import React, { memo, useMemo } from 'react';
import { Image, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { useImageResolver } from '../image-resolver/context';
import { ListingCard } from '../listing-card';
import { resolvePhoto } from '../listing-card/shared';
import { ListingHeader } from '../listing-details';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ListingPreviewData, ListingPreviewMode, ListingPreviewPaneProps } from './types';

/**
 * A side panel that previews the listing while it is edited: Bloom's own
 * `ListingCard`, or a compact listing page, switched by a toggle.
 *
 *   panel    neutral-50 (dark neutral-900) fill, radius 20, p 20, gap 16
 *   head     title (headline-semibold) and description (body-2-regular,
 *            text-secondary) over a `SegmentedControl` (`tabs`, stretched)
 *   card     `ListingCard` at most 320 wide, centred, non-interactive
 *   page     a 340-wide frame (radius 20, 1px neutral-200 / dark neutral-700,
 *            the page background): the cover photo at 4:3, `ListingHeader`
 *            at `medium`, the facts row, the description (six lines), and the
 *            price line under a hairline
 *
 * The preview is DRAWN from `listing`, so it is live as long as the app passes
 * the draft it is editing. `renderPage` replaces the built-in page.
 */

const CARD_MAX_WIDTH = 320;
const PAGE_WIDTH = 340;

function ListingPreviewPaneComponent({
  listing,
  mode: modeProp,
  defaultMode = 'card',
  onModeChange,
  renderPage,
  title = 'Preview',
  description = 'This is how guests will see your listing.',
  cardLabel = 'Card',
  pageLabel = 'Page',
  toggleLabel = 'Preview as',
  style,
  testID,
}: ListingPreviewPaneProps) {
  const theme = useTheme();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [mode, setMode] = useControllableState<ListingPreviewMode>({
    value: modeProp,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });

  return (
    <View
      testID={testID}
      style={[
        {
          gap: 16,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
          borderRadius: 20,
          backgroundColor: theme.isDark ? neutral[900] : neutral[50],
        },
        style,
      ]}
    >
      <View style={{ gap: 2 }}>
        <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
          {title}
        </Text>
        {description ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
      <SegmentedControl
        label={toggleLabel}
        type="tabs"
        value={mode}
        onChange={(next) => setMode(next as ListingPreviewMode)}
        style={{ alignSelf: 'stretch' }}
      >
        <SegmentedControlItem value="card" testID={testID ? `${testID}-card-tab` : undefined}>
          <SegmentedControlItemText>{cardLabel}</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="page" testID={testID ? `${testID}-page-tab` : undefined}>
          <SegmentedControlItemText>{pageLabel}</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
      <View
        role="tabpanel"
        accessibilityLabel={mode === 'card' ? cardLabel : pageLabel}
        testID={testID ? `${testID}-${mode}` : undefined}
        style={{ alignItems: 'center' }}
      >
        {mode === 'card' ? (
          <ListingCard {...listing} style={{ width: '100%', maxWidth: CARD_MAX_WIDTH }} />
        ) : renderPage ? (
          renderPage(listing)
        ) : (
          <PagePreview listing={listing} />
        )}
      </View>
    </View>
  );
}

function PagePreview({ listing }: { listing: ListingPreviewData }) {
  const theme = useTheme();
  const resolver = useImageResolver();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const cover = listing.photos[0] ? resolvePhoto(listing.photos[0], resolver, listing.photoVariant) : undefined;
  const hairline = theme.isDark ? neutral[700] : neutral[200];

  return (
    <View
      style={{
        width: '100%',
        maxWidth: PAGE_WIDTH,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: theme.isDark ? neutral[800] : neutral[100] }}>
        {cover ? (
          <Image source={{ uri: cover }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : null}
      </View>
      <View style={{ gap: 12, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 }}>
        <ListingHeader
          title={listing.title}
          size="medium"
          headingLevel={2}
          subtitle={listing.subtitle}
          rating={listing.rating}
          reviewsLabel={listing.reviewCount != null ? `${listing.reviewCount} reviews` : undefined}
          location={listing.location}
        />
        {listing.facts && listing.facts.length > 0 ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {listing.facts.map((fact) => fact.accessibilityLabel ?? fact.label).join(' · ')}
          </Text>
        ) : null}
        {listing.description ? (
          <Text variant="body-regular" numberOfLines={6} style={{ color: theme.colors.text }}>
            {listing.description}
          </Text>
        ) : null}
      </View>
      {listing.price || listing.total ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 4,
            borderTopWidth: 1,
            borderTopColor: hairline,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
            {listing.price ?? listing.total}
          </Text>
          {listing.price && listing.priceUnit ? (
            <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
              {listing.priceUnit}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const ListingPreviewPane = memo(ListingPreviewPaneComponent);
ListingPreviewPane.displayName = 'ListingPreviewPane';
