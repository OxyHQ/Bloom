import { useCardFill } from '../card/use-card-fill';
import { surfaceFillOn } from '../styles/surface-levels';
import { Card } from '../card/Card';
import React, { memo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { Chip } from '../chip';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiNotificationOffLine } from '../icons/remix/RiNotificationOffLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { STAY_SEARCH_TILE_RADIUS } from '../stay-search/constants';
import { useStaySearchPalette } from '../stay-search/palette';
import { useMessages } from '../locale/messages';
import { HOME_SEARCH_MESSAGES } from './messages';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { SavedSearchCardProps } from './types';
import { useCommonMessages } from '../locale/common-messages';

/**
 * One saved search in a list: what it looks for, how much is new, and how
 * often it alerts.
 *
 *   card       radius 16, the card surface with a hairline, 16 inset, 12 between rows
 *   header     a 44px icon tile (radius 12, neutral fill, 22px glyph), the
 *              title (body-semibold, two lines) and, at the right, a primary
 *              `Badge` with the new-results count while it is above 0
 *   criteria   medium outlined `Chip`s (neutral), wrapped 6 apart
 *   footer     a hairline above; a bell (off: a struck bell) and the alert
 *              frequency (body-2-regular, text-secondary) on the left, an
 *              "Edit" secondary button and a secondary delete icon button on the right
 *
 * With `onPress` the header is a named `button` ("<title>, 12 new") that fills
 * uses Bloom's Button interaction; the footer's buttons are its siblings.
 */

export const SAVED_SEARCH_CARD_RADIUS = 16;
const TILE = 44;

function SavedSearchCardComponent({
  title,
  criteria,
  newCount = 0,
  formatNewCount: formatNewCountProp,
  alertFrequency,
  alertsOffLabel: alertsOffLabelProp,
  icon: Icon = RiSearchLine,
  onPress,
  onEdit,
  onDelete,
  editLabel: editLabelProp,
  deleteLabel: deleteLabelProp,
  style,
  testID,
}: SavedSearchCardProps) {
  const { messages } = useMessages(HOME_SEARCH_MESSAGES);
  const formatNewCount = formatNewCountProp ?? messages.newCount;
  const alertsOffLabel = alertsOffLabelProp ?? messages.alertsOff;
  const common = useCommonMessages();
  const editLabel = editLabelProp ?? common.edit;
  const deleteLabel = deleteLabelProp ?? common.delete;
  const theme = useTheme();
  const basePalette = useStaySearchPalette();
  const fill = useCardFill(style);
  const inner = surfaceFillOn(theme, fill);
  const palette = { ...basePalette, barSurface: fill, tile: inner, rowHighlight: inner };
  const hasNew = newCount > 0;

  const card: WebCssStyle = {
    paddingTop: 16,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  };

  const headerContent = (
    <>
      <View
        style={{
          width: TILE,
          height: TILE,
          borderRadius: STAY_SEARCH_TILE_RADIUS,
          backgroundColor: palette.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon width={22} height={22} fill={palette.text} />
      </View>
      <Text
        variant="body-semibold"
        numberOfLines={2}
        style={{ flex: 1, minWidth: 0, color: palette.text }}
      >
        {title}
      </Text>
      {hasNew ? (
        <Badge
          content={formatNewCount(newCount)}
          color="primary"
          variant="solid"
          size="md"
          testID={testID ? `${testID}-badge` : undefined}
        />
      ) : null}
    </>
  );

  const headerStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    marginTop: -6,
    marginLeft: -6,
    marginRight: -6,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
  };

  const name = hasNew ? `${title}, ${formatNewCount(newCount)}` : title;

  return (
    <Card radius="radius-16" elevation="none" testID={testID} style={[card, style]}>
      {onPress ? (
        <Button
          appearance="plain"
          tone="neutral"
          accessibilityLabel={name}
          onPress={onPress}
          testID={testID ? `${testID}-open` : undefined}
          style={[headerStyle, { height: 'auto', justifyContent: 'flex-start' }]}
        >
          {headerContent}
        </Button>
      ) : (
        <View style={headerStyle}>{headerContent}</View>
      )}
      {criteria && criteria.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {criteria.map((item, index) => (
            <Chip key={`${index}-${item}`} size="md" variant="outlined">
              {item}
            </Chip>
          ))}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        {alertFrequency ? (
          <RiNotification3Line width={16} height={16} fill={palette.textSecondary} />
        ) : (
          <RiNotificationOffLine width={16} height={16} fill={palette.textSecondary} />
        )}
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          style={{ flex: 1, minWidth: 0, color: palette.textSecondary }}
        >
          {alertFrequency ?? alertsOffLabel}
        </Text>
        {onEdit ? (
          <Button
            size="sm"
            onPress={onEdit}
            accessibilityLabel={messages.actionOn(editLabel, title)}
            testID={testID ? `${testID}-edit` : undefined}
            tone="neutral"
            appearance="outline"
          >
            {editLabel}
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            size="sm"
            iconOnly
            icon={RiDeleteBinLine}
            onPress={onDelete}
            accessibilityLabel={messages.actionOn(deleteLabel, title)}
            testID={testID ? `${testID}-delete` : undefined}
            tone="neutral"
            appearance="outline"
          />
        ) : null}
      </View>
    </Card>
  );
}

export const SavedSearchCard = memo(SavedSearchCardComponent);
SavedSearchCard.displayName = 'SavedSearchCard';
