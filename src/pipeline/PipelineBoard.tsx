import React, { memo } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip, ChipRow } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import { useContainerWidth } from '../hooks/use-container-width';
import { PipelineColumn } from './PipelineColumn';
import {
  PIPELINE_COLUMN_WIDTH,
  PIPELINE_SINGLE_MAX_WIDTH,
} from './constants';
import type { PipelineBoardLayout, PipelineBoardProps, PipelineStage } from './types';

/**
 * The stages side by side, or one at a time.
 *
 *   board    a horizontal scroller of fixed-width columns, 12 apart. The
 *            scroller is the board's own, so the page behind it does not move
 *            sideways when a column overflows.
 *   single   a scrolling TAB ROW of stage names and the selected column at full
 *            width. This is the phone layout: five stage names do not fit a
 *            `SegmentedControl` at 390, and a segmented control that clips is
 *            worse than a row that admits it scrolls.
 *   auto     measures ITSELF and picks — so a board in a side panel behaves
 *            like a phone without asking the window how wide it is.
 *
 * **THERE IS NO DRAG AND DROP, deliberately.** Moving a deal between stages is
 * the app's transaction — it has the optimistic update, the rollback, the
 * permission check and the undo — and a half-built drag (one that reorders the
 * view and forgets to tell the server, or that fights a horizontal scroller on
 * a touch screen) is worse than none. What the board exposes instead is the
 * AFFORDANCE: `DealCard`'s `onMove`, plus its `actions` slot for a menu. See
 * `docs/pipeline.mdx`.
 *
 * The board never inspects what `renderStage` returns, and never reads a child's
 * type to decide anything: the stage list is data, the cards are opaque.
 */
function resolveLayout(
  layout: PipelineBoardLayout,
  width: number | null,
  singleMaxWidth: number,
): 'board' | 'single' {
  if (layout !== 'auto') return layout;
  // Before the first layout the width is unknown. `board` is the honest default:
  // it scrolls, so it is merely cramped at a phone width, while `single` on a
  // desktop would hide four columns behind a tab row nobody asked for.
  if (width === null) return 'board';
  return width <= singleMaxWidth ? 'single' : 'board';
}

function PipelineBoardComponent({
  stages,
  renderStage,
  layout = 'auto',
  stageId,
  defaultStageId,
  onStageChange,
  columnWidth = PIPELINE_COLUMN_WIDTH,
  singleMaxWidth = PIPELINE_SINGLE_MAX_WIDTH,
  accessibilityLabel,
  style,
  testID,
}: PipelineBoardProps) {
  const { width, onLayout } = useContainerWidth();
  const [selectedId, setSelectedId] = useControllableState<string | undefined>({
    value: stageId,
    defaultValue: defaultStageId ?? stages[0]?.id,
    onChange: (next) => {
      if (next !== undefined) onStageChange?.(next);
    },
  });

  const resolved = resolveLayout(layout, width, singleMaxWidth);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const column = (stage: PipelineStage, fixedWidth: number | undefined) => (
    <PipelineColumn
      key={stage.id}
      name={stage.name}
      count={stage.count}
      total={stage.total}
      tone={stage.tone}
      emptyLabel={stage.emptyLabel}
      loading={stage.loading}
      onLoadMore={stage.onLoadMore}
      loadMoreLabel={stage.loadMoreLabel}
      width={fixedWidth}
      testID={id(`column-${stage.id}`)}
    >
      {renderStage(stage)}
    </PipelineColumn>
  );

  if (resolved === 'single') {
    const current = stages.find((stage) => stage.id === selectedId) ?? stages[0];
    return (
      <View onLayout={onLayout} style={[{ minWidth: 0 }, style]} testID={testID}>
        <ChipRow
          role="tablist"
          accessibilityLabel={accessibilityLabel ?? 'Pipeline stages'}
          gap={6}
          style={{ minWidth: 0 }}
          testID={id('tabs')}
        >
          {stages.map((stage) => (
            <Chip
              key={stage.id}
              role="tab"
              size="xl"
              selected={stage.id === current?.id}
              onPress={() => setSelectedId(stage.id)}
              accessibilityLabel={
                stage.count === undefined ? stage.name : `${stage.name}, ${stage.count} deals`
              }
              testID={id(`tab-${stage.id}`)}
            >
              {stage.name}
            </Chip>
          ))}
        </ChipRow>
        <View style={{ marginTop: 12 }}>{current ? column(current, undefined) : null}</View>
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={[{ minWidth: 0 }, style]} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={accessibilityLabel}
        // `minWidth: 0` is what makes this SCROLL rather than stretch. A flex
        // item's automatic minimum is its content width, so without it five
        // 288 columns widen the board, then the page, then the document — the
        // whole screen scrolls sideways and the board never does.
        style={{ minWidth: 0 }}
        contentContainerStyle={{ gap: 12, alignItems: 'flex-start' }}
        testID={id('scroller')}
      >
        {stages.map((stage) => column(stage, columnWidth))}
      </ScrollView>
    </View>
  );
}

export const PipelineBoard = memo(PipelineBoardComponent);
PipelineBoard.displayName = 'PipelineBoard';
