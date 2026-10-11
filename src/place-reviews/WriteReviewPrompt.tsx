import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiQuillPenLine } from '../icons/remix/RiQuillPenLine';
import { HousingCard, IconTile, useHousingPalette } from '../tenancy/parts';
import { Text } from '../typography';
import type { WriteReviewPromptProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { PLACE_REVIEWS_MESSAGES } from './messages';

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
  title: titleProp,
  description,
  actionLabel: actionLabelProp,
  onStart,
  onDismiss,
  dismissLabel: dismissLabelProp,
  media,
  style,
  testID,
}: WriteReviewPromptProps) {
  const common = useCommonMessages();
  const { messages } = useMessages(PLACE_REVIEWS_MESSAGES);
  const title = titleProp ?? messages.promptTitle;
  const actionLabel = actionLabelProp ?? messages.writeReview;
  const dismissLabel = dismissLabelProp ?? common.dismiss;
  const palette = useHousingPalette();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const body = description ?? messages.promptDescription(buildingTitle);

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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 260,
          }}
        >
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
            <Text
              variant="body-2-regular"
              style={{ color: palette.textSecondary }}
              testID={id('description')}
            >
              {body}
            </Text>
          </View>
        </View>
        <Button
          size="sm"
          leadingIcon={RiQuillPenLine}
          onPress={onStart}
          testID={id('start')}
          tone="accent"
          appearance="solid"
        >
          {actionLabel}
        </Button>
      </View>
      {onDismiss ? (
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <Button
            size="xs"
            iconOnly
            leadingIcon={RiCloseLine}
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            testID={id('dismiss')}
            tone="neutral"
            appearance="outline"
          />
        </View>
      ) : null}
    </HousingCard>
  );
}

export const WriteReviewPrompt = memo(WriteReviewPromptComponent);
WriteReviewPrompt.displayName = 'WriteReviewPrompt';
