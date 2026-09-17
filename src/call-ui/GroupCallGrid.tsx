import React, { memo, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { GroupCallTile } from './GroupCallTile';
import { CALL_UI_RADIUS, callGridLayout, callSpotlightIndex, resolveCallPaint } from './shared';
import type { GroupCallGridProps } from './types';

/**
 * `GroupCallGrid`: everyone on the call.
 *
 *   layout="grid"       equal tiles, `ceil(sqrt(n))` columns — 2 side by side,
 *                       4 a square, 6 as 3×2, 9 as 3×3
 *   layout="spotlight"  one big tile (the presenter, else the speaker, else the
 *                       first) over a strip of the rest
 *
 * Past `maxTiles` the last CELL becomes `+N`, rather than a cell being added
 * beside the grid: a 9-up grid that quietly becomes a 10-cell 4×3 the moment a
 * tenth person joins is the failure this shape exists to stop. The maths is
 * `callGridLayout`, a pure function, and it is tested as one.
 *
 * The grid MEASURES itself (`onLayout`) unless `width` is given, and draws
 * nothing until it has a width — a first paint at zero stacks every tile on top
 * of itself, and on native that frame is visible.
 */

/** Tiles in the spotlight strip before it stops adding them. */
const STRIP_MAX = 5;

function GroupCallGridComponent({
  participants,
  layout = 'grid',
  spotlightId,
  maxTiles = 9,
  columns: columnsOverride,
  gap = 8,
  aspectRatio = 1,
  width,
  onParticipantPress,
  formatOverflow,
  formatMuted,
  style,
  testID,
}: GroupCallGridProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme), [theme]);
  const [measured, setMeasured] = useState(0);
  const available = width ?? measured;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setMeasured((current) => (current === next ? current : next));
  };

  const overflowText = formatOverflow ?? ((count: number) => `+${count} more`);
  const spotlightAt = layout === 'spotlight' ? callSpotlightIndex(participants, spotlightId) : -1;
  const spotlight = spotlightAt >= 0 ? participants[spotlightAt] : undefined;
  const strip =
    layout === 'spotlight' ? participants.filter((_, i) => i !== spotlightAt).slice(0, STRIP_MAX) : [];
  const grid =
    layout === 'spotlight'
      ? undefined
      : callGridLayout(participants.length, maxTiles, columnsOverride);

  const tileWidth =
    grid === undefined ? 0 : Math.floor((available - gap * (grid.columns - 1)) / grid.columns);
  const stripWidth =
    strip.length === 0 ? 0 : Math.floor((available - gap * (strip.length - 1)) / strip.length);

  return (
    <View
      style={[{ width: '100%' }, style]}
      onLayout={width === undefined ? onLayout : undefined}
      testID={testID}
    >
      {available <= 0 ? null : layout === 'spotlight' ? (
        <View style={{ gap }}>
          {spotlight === undefined ? null : (
            <GroupCallTile
              participant={spotlight}
              width={available}
              height={Math.round(available / Math.max(0.5, aspectRatio * 1.35))}
              prominent
              onPress={onParticipantPress}
              formatMuted={formatMuted}
              testID={testID ? `${testID}-spotlight` : undefined}
            />
          )}
          {strip.length === 0 ? null : (
            <View style={{ flexDirection: 'row', gap }}>
              {strip.map((participant) => (
                <GroupCallTile
                  key={participant.id}
                  participant={participant}
                  width={stripWidth}
                  height={Math.round(stripWidth / aspectRatio)}
                  onPress={onParticipantPress}
                  formatMuted={formatMuted}
                  testID={testID ? `${testID}-strip-${participant.id}` : undefined}
                />
              ))}
            </View>
          )}
        </View>
      ) : grid === undefined ? null : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {participants.slice(0, grid.visible).map((participant) => (
            <GroupCallTile
              key={participant.id}
              participant={participant}
              width={tileWidth}
              height={Math.round(tileWidth / aspectRatio)}
              onPress={onParticipantPress}
              formatMuted={formatMuted}
              testID={testID ? `${testID}-tile-${participant.id}` : undefined}
            />
          ))}
          {grid.overflow > 0 ? (
            <View
              accessibilityLabel={overflowText(grid.overflow)}
              style={{
                width: tileWidth,
                height: Math.round(tileWidth / aspectRatio),
                borderRadius: CALL_UI_RADIUS.tile,
                backgroundColor: paint.tile,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID={testID ? `${testID}-overflow` : undefined}
            >
              <Text variant="title-2-medium" numberOfLines={1} style={{ color: paint.onStage }}>
                {overflowText(grid.overflow)}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export const GroupCallGrid = memo(GroupCallGridComponent);
GroupCallGrid.displayName = 'GroupCallGrid';
