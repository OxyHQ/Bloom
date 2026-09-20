import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import * as Skeleton from '../skeleton';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PIPELINE_CARD_GAP,
  PIPELINE_COLUMN_PADDING,
  PIPELINE_SKELETON_CARDS,
} from './constants';
import { pipelineColumnFill, resolvePipelinePaint } from './shared';
import type { PipelineColumnProps } from './types';

/**
 * ONE STAGE: its name, how many deals are in it, what they add up to, and the
 * cards themselves.
 *
 *   header   a 8 dot in the stage's tone, the name, the count as a counter
 *            badge, and the TOTAL right-aligned on one line — an amount that
 *            wraps mid-number is a different number to a reader
 *   rule     a hairline under the header, read off the column's own fill
 *   body     the cards at 8 apart, or the empty state, or the placeholders
 *   footer   the "load more" action, when the app has more to give
 *
 * The column paints ONE STEP off whatever is behind it (`surfaceFillOn`) and
 * publishes that fill, so the cards inside step off the column rather than off
 * the page — the same column reads on a page, in a panel and in a dialog.
 *
 * The TOTAL is a string the app supplies, for the reason `DealCard`'s amount is.
 */
function PipelineColumnComponent({
  name,
  count,
  total,
  tone = 'primary',
  emptyLabel = 'No deals in this stage',
  loading = false,
  onLoadMore,
  loadMoreLabel = 'Load more',
  children,
  width,
  style,
  testID,
}: PipelineColumnProps) {
  const theme = useTheme();
  const behind = useSurfaceFill();
  const fill = useMemo(() => pipelineColumnFill(theme, behind), [theme, behind]);
  const paint = useMemo(() => resolvePipelinePaint(theme, fill), [theme, fill]);
  const dot = resolveAccentColors(theme.colors, tone, 'solid').background;

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const hasCards = React.Children.count(children) > 0;

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <View
        style={[
          {
            width,
            backgroundColor: paint.surface,
            borderRadius: 16,
            padding: PIPELINE_COLUMN_PADDING,
            gap: PIPELINE_CARD_GAP,
            ...surfaceFillVars(paint.surface),
          },
          style,
        ]}
        testID={testID}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingBottom: PIPELINE_CARD_GAP,
            borderBottomWidth: 1,
            borderBottomColor: paint.hairline,
          }}
        >
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }}
            testID={id('dot')}
          />
          <Text
            variant="body-semibold"
            numberOfLines={1}
            style={{ color: paint.text, flexShrink: 1 }}
            testID={id('name')}
          >
            {name}
          </Text>
          {count === undefined ? null : (
            <Badge content={count} variant="subtle" color="default" size="medium" testID={id('count')} />
          )}
          <View style={{ flex: 1 }} />
          {total ? (
            <Text
              variant="caption-1-medium"
              numberOfLines={1}
              style={{ color: paint.textSecondary, flexShrink: 0 }}
              testID={id('total')}
            >
              {total}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={{ gap: PIPELINE_CARD_GAP }} testID={id('loading')}>
            {Array.from({ length: PIPELINE_SKELETON_CARDS }, (_, index) => (
              <Skeleton.Box key={index} height={92} borderRadius={12} />
            ))}
          </View>
        ) : hasCards ? (
          <View style={{ gap: PIPELINE_CARD_GAP }}>{children}</View>
        ) : (
          <View
            style={{
              paddingTop: 20,
              paddingBottom: 20,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: paint.hairline,
              alignItems: 'center',
            }}
            testID={id('empty')}
          >
            <Text variant="body-2-regular" style={{ color: paint.textTertiary, textAlign: 'center' }}>
              {emptyLabel}
            </Text>
          </View>
        )}

        {onLoadMore && !loading ? (
          <Button variant="text" size="small" onPress={onLoadMore} testID={id('load-more')}>
            {loadMoreLabel}
          </Button>
        ) : null}
      </View>
    </SurfaceLevelProvider>
  );
}

export const PipelineColumn = memo(PipelineColumnComponent);
PipelineColumn.displayName = 'PipelineColumn';
