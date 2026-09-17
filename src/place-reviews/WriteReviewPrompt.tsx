import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiBuilding2Line, RiCloseLine, RiQuillPenLine } from '../icons/remix';
import { HousingCard, IconTile, useHousingPalette } from '../tenancy/parts';
import { Text } from '../typography';
import type { WriteReviewPromptProps } from './types';

/**
 * An invitation for a past tenant to review the building.
 *
 *   card      the housing card; a row: a 48 building tile (radius 12,
 *             neutral-100 / 700, 24 icon) or `media`, then the text and the
 *             button; wraps so the button drops under the text when narrow
 *   text      title headline-semibold (a heading), description body-2-regular
 *             text-secondary
 *   action    a small primary `Button` with a pen icon
 *   dismiss   a secondary xs icon button in the top-right corner, named
 *             "Dismiss"; the row keeps 28 clear of it
 */
function WriteReviewPromptComponent({
  buildingTitle,
  title = 'Did you live here?',
  description,
  actionLabel = 'Write a review',
  onStart,
  onDismiss,
  dismissLabel = 'Dismiss',
  media,
  style,
  testID,
}: WriteReviewPromptProps) {
  const palette = useHousingPalette();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const body = description ?? `Help future tenants of ${buildingTitle}. Reviews are anonymous.`;

  return (
    <HousingCard style={style} testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 16,
          rowGap: 12,
          paddingRight: onDismiss ? 28 : 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexGrow: 1, flexShrink: 1, flexBasis: 260 }}>
          {media ?? <IconTile icon={RiBuilding2Line} size={48} iconSize={24} testID={id('icon')} />}
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              role="heading"
              aria-level={3}
              variant="headline-semibold"
              style={{ color: palette.text }}
              testID={id('title')}
            >
              {title}
            </Text>
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }} testID={id('description')}>
              {body}
            </Text>
          </View>
        </View>
        <Button variant="primary" size="small" leadingIcon={RiQuillPenLine} onPress={onStart} testID={id('start')}>
          {actionLabel}
        </Button>
      </View>
      {onDismiss ? (
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <Button
            variant="secondary"
            size="xs"
            iconOnly
            leadingIcon={RiCloseLine}
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            testID={id('dismiss')}
          />
        </View>
      ) : null}
    </HousingCard>
  );
}

export const WriteReviewPrompt = memo(WriteReviewPromptComponent);
WriteReviewPrompt.displayName = 'WriteReviewPrompt';
