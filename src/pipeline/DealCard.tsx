import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { GlyphButton } from '../button';
import { Card } from '../card';
import { RiArrowLeftRightLine } from '../icons/remix/RiArrowLeftRightLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEAL_CARD_PADDING, DEAL_HEALTH } from './constants';
import {
  PIPELINE_STYLE_ID,
  PIPELINE_WEB_CSS,
  dealHealthLabel,
  dealHealthTone,
  joinDealName,
  resolvePipelinePaint,
} from './shared';
import type { DealCardProps } from './types';

/**
 * One deal, as it appears in a column.
 *
 *   header   the title (2 lines max) with the move action and the `actions` slot
 *            beside it
 *   account  the company, quiet, one line
 *   figures  the AMOUNT on the left and the close date on the right, both one
 *            line and neither allowed to wrap — an amount broken across two
 *            lines is a different number to a reader
 *   footer   the health signal, and the owner's avatar
 *
 * **The amount is a STRING the app formats.** Currency, locale, rounding and
 * abbreviation are four decisions the card cannot make, and a card that guessed
 * one of them would be wrong in a way nobody notices until a customer does.
 *
 * **The press target is the title block, not the card.** The move action and the
 * `actions` slot are controls, and a control inside a control is invalid on web
 * and ambiguous everywhere else — so `onPress` is bound to the text, which is
 * still the largest target on the card.
 */
function DealCardComponent({
  title,
  account,
  amount,
  closeDate,
  owner,
  stage,
  health,
  healthLabel,
  stalledFor,
  onPress,
  onMove,
  moveLabel,
  actions,
  accessibilityLabel,
  style,
  testID,
}: DealCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolvePipelinePaint(theme, theme.colors.card), [theme]);

  useEffect(() => {
    adoptStyleSheet(PIPELINE_STYLE_ID, PIPELINE_WEB_CSS);
  }, []);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const signal = dealHealthLabel({ health, healthLabel, stalledFor });
  const HealthIcon = health === undefined ? undefined : DEAL_HEALTH[health].icon;

  const titleBlock = (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <Text
        variant="body-semibold"
        numberOfLines={2}
        style={{ color: paint.text }}
        testID={id('title')}
      >
        {title}
      </Text>
      {account ? (
        <Text
          variant="caption-1-regular"
          numberOfLines={1}
          style={{ color: paint.textSecondary }}
          testID={id('account')}
        >
          {account}
        </Text>
      ) : null}
    </View>
  );

  const ringVars: WebCssStyle = { '--bloom-deal-ring': paint.ring };
  const subject = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? joinDealName([title, account, amount])}
      onPress={onPress}
      {...webDataSet({ bloomDealSubject: '' })}
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, borderRadius: 8, ...ringVars },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={id('subject')}
    >
      {titleBlock}
    </Pressable>
  ) : (
    titleBlock
  );

  return (
    <SurfaceLevelProvider level={2} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-12"
        style={[
          { padding: DEAL_CARD_PADDING, gap: 8, ...surfaceFillVars(paint.surface) },
          style,
        ]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
          {subject}
          {onMove ? (
            <GlyphButton
              icon={RiArrowLeftRightLine}
              size={32}
              glyphSize={18}
              onPress={onMove}
              hoverFill={paint.raised}
              ring={paint.ring}
              accessibilityLabel={moveLabel ?? `Move ${title}`}
              testID={id('move')}
            />
          ) : null}
          {actions ? (
            <View style={{ flexShrink: 0 }} testID={id('actions')}>
              {actions}
            </View>
          ) : null}
        </View>

        {amount || closeDate ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {amount ? (
              <Text
                variant="headline-semibold"
                numberOfLines={1}
                style={{ color: paint.text, flexShrink: 0 }}
                testID={id('amount')}
              >
                {amount}
              </Text>
            ) : (
              <View />
            )}
            {closeDate ? (
              <Text
                variant="caption-1-regular"
                numberOfLines={1}
                style={{ color: paint.textTertiary, flexShrink: 1, textAlign: 'right' }}
                testID={id('close-date')}
              >
                {closeDate}
              </Text>
            ) : null}
          </View>
        ) : null}

        {signal || stage || owner ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {signal ? (
              <Badge
                content={signal}
                icon={HealthIcon}
                variant="subtle"
                color={dealHealthTone(health)}
                size="label-small"
                testID={id('health')}
              />
            ) : null}
            {stage ? (
              <Badge
                content={stage}
                variant="outlined"
                color="default"
                size="label-small"
                testID={id('stage')}
              />
            ) : null}
            <View style={{ flex: 1 }} />
            {owner ? (
              <Avatar size={24} source={owner.avatar} name={owner.name} alt={owner.name} testID={id('owner')} />
            ) : null}
          </View>
        ) : null}
      </Card>
    </SurfaceLevelProvider>
  );
}

export const DealCard = memo(DealCardComponent);
DealCard.displayName = 'DealCard';
