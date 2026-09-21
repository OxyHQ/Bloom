import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View, type TextStyle } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { Card } from '../card';
import { useContainerWidth } from '../hooks/use-container-width';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiRouteLine } from '../icons/remix/RiRouteLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { PriceSummary } from '../price-breakdown';
import { RouteStops } from '../route-stops';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { BloomIconComponent } from '../icons/icon-component';
import type { RouteStop } from '../route-stops';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { VEHICLE_ICON } from '../vehicle-picker';
import { JOB_BOARD_GEOMETRY, JOB_BOARD_LABELS, JOB_STATE_TONE } from './constants';
import {
  JOB_BOARD_STYLE_ID,
  JOB_BOARD_WEB_CSS,
  jobActionsAreLabelled,
  joinJobName,
  resolveJobPaint,
  type JobPaint,
} from './shared';
import type { JobCardProps, JobPlace } from './types';

/**
 * One piece of work, from the side of the person who would do it.
 *
 * It is `carrier-quote`'s card seen from the other side of the table, and it is
 * drawn as the same object: the same blocks in the same order, the same tile
 * row, the same 420 threshold, the same footer over a hairline. What changes is
 * WHOSE number the headline is — there the price a carrier is asking, here the
 * pay a courier would receive.
 *
 *   mark      the 48 vehicle tile, where the offer card puts the 48 avatar
 *   identity  the load at `title-3-semibold`, then ONE meta line — the vehicle,
 *             the job's own tags
 *   headline  the pay at `title-1-medium` in tabular figures, right-aligned
 *             against the load, with `payNote` under it
 *   route     `RouteStops`: pick-up, anything between, drop-off. Not a second
 *             pin column — that family already owns the marker, the connector
 *             and the position words
 *   tiles     distance, time, window, as rounded tiles: the value over what it
 *             is. One row on a wide card, two columns on a narrow one
 *   expiry    how long the offer stands, warning-toned
 *   pay       the itemisation, collapsed, through `PriceSummary`
 *   footer    pass, take — over the card's hairline
 *
 *   compact   no surface, no route, no tiles, no breakdown (the board owns all
 *             of it): 64 tall, a 36 mark, the load, one meta line, the pay at
 *             the end.
 *
 * **A CLOSED JOB IS DRAWN, NOT REMOVED.** A job that is taken or expires while
 * the reader is looking at it keeps its place, dims to the disabled opacity and
 * replaces both actions with a `Badge` saying which of the two happened. A row
 * that vanished under a thumb is indistinguishable from a mis-tap, and the
 * reader is left unsure whether they took the job or lost it.
 *
 * **The card is not one big button.** `onPressJob` is bound to the LOAD BLOCK
 * and the two actions sit outside it — a control inside a control is invalid on
 * web and ambiguous everywhere, and it renders fine either way.
 *
 * **MONEY ARRIVES FORMATTED.** `pay`, `payNote` and every `payLines` amount are
 * drawn exactly as given. `payValue` is a separate NUMBER used for ordering and
 * for the pay filter, and it is never drawn.
 */

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/** One reading in the tile row: what it is, what it says, and its glyph. */
interface JobTile {
  key: string;
  label: string;
  value: string;
  icon?: BloomIconComponent;
}

/** The fill the content lands on, and everything derived from it. */
function useJobPaint(onCard: boolean): JobPaint {
  const theme = useTheme();
  const ambient = useSurfaceFill();
  const surface = onCard ? theme.colors.card : ambient;
  return useMemo(() => resolveJobPaint(theme, surface), [theme, surface]);
}

function JobCardComponent({
  job,
  onTake,
  onPass,
  onPressJob,
  route,
  breakdown,
  defaultBreakdownExpanded = false,
  density = 'comfortable',
  selected = false,
  disabled = false,
  actions,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: JobCardProps) {
  const theme = useTheme();
  const comfortable = density === 'comfortable';
  const paint = useJobPaint(comfortable);
  const { width, onLayout } = useContainerWidth();
  const labelled = comfortable && jobActionsAreLabelled(width, JOB_BOARD_GEOMETRY.narrowWidth);
  const labels = useMemo(
    () => ({
      ...JOB_BOARD_LABELS,
      ...labelOverrides,
      state: { ...JOB_BOARD_LABELS.state, ...labelOverrides?.state },
    }),
    [labelOverrides],
  );

  useEffect(() => {
    adoptStyleSheet(JOB_BOARD_STYLE_ID, JOB_BOARD_WEB_CSS);
  }, []);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const state = job.state ?? 'open';
  const closed = state !== 'open';
  // A closed job takes no press of any kind. `disabled` is a CONSTRAINT: it
  // combines with the job's own state rather than replacing it, so a caller
  // cannot re-enable a job the marketplace has already given away.
  const inert = disabled || closed;
  const warning = resolveAccentColors(theme.colors, 'warning', 'subtle');
  const stateWord = closed ? labels.state[state] : undefined;

  const MarkIcon: BloomIconComponent | undefined =
    job.vehicleIcon ?? (job.vehicleKind ? VEHICLE_ICON[job.vehicleKind] : undefined);
  const markSize = JOB_BOARD_GEOMETRY.mark[density];
  const mark = (
    <View
      aria-hidden
      style={{
        width: markSize,
        height: markSize,
        borderRadius: JOB_BOARD_GEOMETRY.tileRadius,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: paint.tile,
      }}
      testID={id('mark')}
    >
      {/* A marketplace that routes five bodies has five glyphs; without a
          vehicle the mark stays the generic route glyph rather than guessing
          which one the job needs. */}
      {React.createElement(MarkIcon ?? RiRouteLine, {
        width: comfortable ? 22 : 18,
        height: comfortable ? 22 : 18,
        fill: paint.tileText.textSecondary,
      })}
    </View>
  );

  const loadLine = (
    <Text
      variant={comfortable ? 'title-3-semibold' : 'body-semibold'}
      numberOfLines={comfortable ? 2 : 1}
      style={{ color: paint.text }}
      testID={id('load')}
    >
      {job.load}
    </Text>
  );

  // The tags sit on the META line, never beside the load. A pill states a fact
  // in one word and must not shrink; the load beside it is what gives way.
  const tagPills = (job.tags ?? []).map((tag) => (
    <Badge
      key={tag}
      content={tag}
      variant="subtle"
      color="default"
      size="label-medium"
      style={{ flexShrink: 0 }}
      testID={id(`tag-${tag}`)}
    />
  ));

  const metaWords = joinJobName([job.vehicle, job.loadNote], ' · ');
  const metaLine =
    stateWord !== undefined || tagPills.length > 0 || metaWords !== '' ? (
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
        testID={id('meta')}
      >
        {stateWord !== undefined ? (
          <Badge
            content={stateWord}
            variant="subtle"
            color={JOB_STATE_TONE[state as 'taken' | 'expired']}
            size="label-medium"
            style={{ flexShrink: 0 }}
            testID={id('state')}
          />
        ) : null}
        {tagPills}
        {metaWords !== '' ? (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            style={{ flexShrink: 1, color: paint.textSecondary }}
          >
            {metaWords}
          </Text>
        ) : null}
      </View>
    ) : null;

  const identity = (
    <View style={{ flex: 1, minWidth: 0, gap: comfortable ? 4 : 2 }}>
      {loadLine}
      {metaLine}
    </View>
  );

  const jobName = joinJobName([
    job.load,
    stateWord,
    job.pay,
    job.vehicle,
    job.distance,
    job.duration,
    job.window,
    job.pickup.title,
    job.dropoff.title,
  ]);

  const ringVars: WebCssStyle = { '--bloom-job-ring': paint.accent };
  const subject = onPressJob ? (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel ?? jobName}
      onPress={() => onPressJob(job.id)}
      disabled={inert}
      aria-disabled={inert || undefined}
      accessibilityState={{ disabled: inert }}
      {...webDataSet({ bloomJobSubject: '' })}
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, borderRadius: 12, ...ringVars },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={id('subject')}
    >
      {identity}
    </Pressable>
  ) : (
    identity
  );

  // THE NOTE MOVES OFF THE HEAD ROW ON A NARROW CARD. Beside the amount it is
  // the widest thing in a column that does not shrink, so at 390 a five-word
  // note ("Before the platform fee") took a third of the card and the LOAD —
  // the one line the job is recognised by — was the thing that gave way.
  const noteBelow = comfortable && !labelled && job.payNote !== undefined;
  const headline = (
    <View style={{ alignItems: 'flex-end', flexShrink: 0, gap: 2 }} testID={id('pay')}>
      <Text
        variant={comfortable ? 'title-1-medium' : 'headline-semibold'}
        numberOfLines={1}
        style={[{ color: paint.text }, TABULAR]}
        testID={id('pay-amount')}
      >
        {job.pay}
      </Text>
      {job.payNote && !noteBelow ? (
        <Text
          variant="caption-1-regular"
          numberOfLines={1}
          style={{ color: paint.textSecondary, textAlign: 'right' }}
          testID={id('pay-note')}
        >
          {job.payNote}
        </Text>
      ) : null}
    </View>
  );

  // ---------------------------------------------------------------------
  //  compact: a list row, and nothing a board would draw twice
  // ---------------------------------------------------------------------
  if (!comfortable) {
    return (
      <View
        style={[
          {
            minHeight: JOB_BOARD_GEOMETRY.rowMinHeight,
            justifyContent: 'center',
            opacity: inert ? DISABLED_OPACITY : 1,
          },
          style,
        ]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {mark}
          {subject}
          {headline}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------
  //  comfortable: the job card
  // ---------------------------------------------------------------------
  const toStop = (place: JobPlace, key: string, position: string): RouteStop => ({
    id: key,
    title: place.title,
    subtitle: place.subtitle,
    meta: place.meta,
    accessibilityLabel: joinJobName([position, place.title, place.subtitle, place.meta]),
  });
  const stops: RouteStop[] = [
    toStop(job.pickup, 'pickup', labels.pickup),
    ...(job.via ?? []).map((place, index) => toStop(place, `via-${index}`, `${index + 2}`)),
    toStop(job.dropoff, 'dropoff', labels.dropoff),
  ];

  // Only the tiles the job actually answers. A tile drawn with an em dash is a
  // slot the job did not fill, which reads as a number that failed to load.
  const tiles: JobTile[] = [];
  if (job.distance)
    tiles.push({
      key: 'distance',
      label: labels.distance,
      value: job.distance,
      icon: RiMapPin2Line,
    });
  if (job.duration)
    tiles.push({ key: 'duration', label: labels.duration, value: job.duration, icon: RiTimerLine });
  if (job.window)
    tiles.push({ key: 'window', label: labels.window, value: job.window, icon: RiTimeLine });

  const tileRows: JobTile[][] = [];
  if (labelled) {
    if (tiles.length > 0) tileRows.push(tiles);
  } else {
    for (let i = 0; i < tiles.length; i += 2) tileRows.push(tiles.slice(i, i + 2));
  }

  const showRoute = route ?? true;
  const showBreakdown = (breakdown ?? true) && (job.payLines?.length ?? 0) > 0;
  // The looked-at card takes a 2px border and gives the extra pixel back out of
  // its own inset, so nothing inside it moves when it is chosen.
  const inset = JOB_BOARD_GEOMETRY.padding - (selected ? 1 : 0);

  const hasOwnActions = onTake !== undefined || onPass !== undefined;
  const actionRow =
    actions ??
    (!hasOwnActions ? null : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID={id('actions')}>
        {onPass && !closed ? (
          <Button
            variant="text"
            size="medium"
            iconOnly={!labelled}
            leadingIcon={RiCloseLine}
            onPress={() => onPass(job.id)}
            disabled={disabled}
            hitSlop={JOB_BOARD_GEOMETRY.actionHit}
            accessibilityLabel={`${labels.pass} ${job.load}`}
            testID={id('pass')}
          >
            {labelled ? labels.pass : undefined}
          </Button>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }} />
        {closed ? (
          // The take action is GONE rather than disabled: a greyed-out primary
          // button invites a press that can never succeed, and the badge beside
          // the load already says why.
          <Badge
            content={stateWord}
            variant="subtle"
            color={JOB_STATE_TONE[state as 'taken' | 'expired']}
            size="label-medium"
            testID={id('closed')}
          />
        ) : onTake ? (
          <Button
            variant="primary"
            size="medium"
            onPress={() => onTake(job.id)}
            disabled={disabled}
            accessibilityLabel={`${labels.take} ${job.load}, ${job.pay}`}
            testID={id('take')}
          >
            {labels.take}
          </Button>
        ) : null}
      </View>
    ));

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-20"
        style={[
          surfaceFillVars(paint.surface),
          selected ? { borderWidth: 2, borderColor: paint.accent } : null,
          inert ? { opacity: DISABLED_OPACITY } : null,
          style,
        ]}
        testID={testID}
      >
        <View
          // The card measures ITSELF, not the window: this same card is 358
          // wide in a phone column and 720 in a board pane.
          onLayout={onLayout}
          style={{
            paddingTop: inset,
            paddingBottom: inset,
            paddingLeft: inset,
            paddingRight: inset,
            gap: JOB_BOARD_GEOMETRY.gap,
          }}
          testID={id('content')}
        >
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {mark}
              {subject}
              {headline}
            </View>
            {noteBelow ? (
              <Text
                variant="caption-1-regular"
                numberOfLines={1}
                style={{ color: paint.textSecondary, textAlign: 'right' }}
                testID={id('pay-note')}
              >
                {job.payNote}
              </Text>
            ) : null}
          </View>

          {showRoute ? (
            <RouteStops
              stops={stops}
              density="compact"
              labels={{ origin: labels.pickup, destination: labels.dropoff }}
              accessibilityLabel={`${labels.pickup} and ${labels.dropoff}`}
              testID={id('route')}
            />
          ) : null}

          {tileRows.length > 0 ? (
            <View style={{ gap: JOB_BOARD_GEOMETRY.tileGap }} testID={id('tiles')}>
              {tileRows.map((row, rowIndex) => (
                <View
                  key={`tile-row-${rowIndex}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: JOB_BOARD_GEOMETRY.tileGap,
                  }}
                >
                  {row.map((tile) => (
                    <View
                      key={tile.key}
                      style={[styles.tile, { backgroundColor: paint.tile }]}
                      testID={id(`tile-${tile.key}`)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {tile.icon ? (
                          <tile.icon width={14} height={14} fill={paint.tileText.textSecondary} />
                        ) : null}
                        <Text
                          variant="body-2-medium"
                          numberOfLines={1}
                          style={{ flexShrink: 1, color: paint.tileText.textSecondary }}
                        >
                          {tile.label}
                        </Text>
                      </View>
                      <Text
                        variant="body-medium"
                        // A narrow card gives a tile half the width, and a
                        // window is the reading most likely to lose its second
                        // half to an ellipsis there.
                        numberOfLines={labelled ? 1 : 2}
                        style={[{ width: '100%', color: paint.tileText.text }, TABULAR]}
                      >
                        {tile.value}
                      </Text>
                    </View>
                  ))}
                  {/* An odd tile keeps its half of the two-column grid. */}
                  {row.length === 1 && !labelled ? <View style={styles.tileSpacer} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {job.expiresIn && !closed ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              testID={id('expires')}
            >
              <RiTimeLine width={14} height={14} fill={warning.foreground} />
              <Text variant="body-2-medium" numberOfLines={1} style={{ color: warning.foreground }}>
                {job.expiresIn}
              </Text>
            </View>
          ) : null}

          {showBreakdown ? (
            <PriceSummary
              lines={job.payLines ?? []}
              total={job.payTotal}
              collapsible
              defaultExpanded={defaultBreakdownExpanded}
              expandLabel={labels.showPay}
              collapseLabel={labels.hidePay}
              accessibilityLabel={`${labels.payDetails} ${job.load}`}
              testID={id('breakdown')}
            />
          ) : null}

          {actionRow ? (
            <View
              style={{ borderTopWidth: 1, borderTopColor: paint.hairline, paddingTop: 12 }}
            >
              {actionRow}
            </View>
          ) : null}
        </View>
      </Card>
    </SurfaceLevelProvider>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 2,
    borderRadius: JOB_BOARD_GEOMETRY.tileRadius,
    paddingTop: JOB_BOARD_GEOMETRY.tilePadding,
    paddingBottom: JOB_BOARD_GEOMETRY.tilePadding,
    paddingLeft: JOB_BOARD_GEOMETRY.tilePadding,
    paddingRight: JOB_BOARD_GEOMETRY.tilePadding,
  },
  tileSpacer: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
});

export const JobCard = memo(JobCardComponent);
JobCard.displayName = 'JobCard';
