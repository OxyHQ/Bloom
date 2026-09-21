import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button, GlyphButton } from '../button';
import { Card } from '../card';
import { Chip, ChipRow } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import { IconCircle } from '../icon-circle';
import { RiEqualizerLine } from '../icons/remix/RiEqualizerLine';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import * as Skeleton from '../skeleton';
import { surfaceFillVars, useSurfaceLevel } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { VEHICLE_ICON, VEHICLE_OPTIONS } from '../vehicle-picker';
import type { VehicleKind } from '../vehicle-picker';
import { JobCard } from './JobCard';
import {
  JOB_BOARD_GEOMETRY,
  JOB_BOARD_LABELS,
  JOB_BOARD_SORTS,
  JOB_DISTANCE_BANDS,
  JOB_VEHICLE_KINDS,
  JOB_WHEN_BANDS,
} from './constants';
import {
  countActiveJobFilters,
  filterJobOffers,
  resolveJobPaint,
  sortJobOffers,
  toggleJobVehicle,
} from './shared';
import type { JobBoardBand, JobBoardFilter, JobBoardProps, JobBoardSort } from './types';

/**
 * The work on offer, filtered, ordered and counted.
 *
 *   head     the count at `body-semibold` on the left; the order as a
 *            `radiogroup` of chips and the refresh control on the right. All
 *            three wrap onto their own line when they do not fit.
 *   filters  one `ChipRow` per dimension, each named and each scrolling
 *            sideways rather than wrapping — four dimensions that wrapped would
 *            be a screen of chips over the first job. Distance, pay and when
 *            are `radiogroup`s of BANDS; vehicle is a `group` of TOGGLES,
 *            because "van or box truck" is a sentence a courier needs to say.
 *   list     the cards, 12 apart
 *   loading  placeholder cards of the same height, announced `busy` — not a
 *            spinner, because the answer arriving is a list
 *   empty    a tinted glyph disc over one line of explanation. With a filter
 *            narrowed and no caller action, the clear control is drawn there:
 *            an empty board the reader caused must offer the undo.
 *
 * **THE ORDER IS THIS COMPONENT'S, NOT THE CALLER'S.** `jobs` arrives in
 * whatever order the app has; `sortJobOffers` puts it in the chosen one and is
 * stable, so two equally-paid jobs never swap places on a re-render.
 *
 * **A CLOSED JOB IS NOT FILTERED OUT.** `filterJobOffers` answers the reader's
 * four questions and nothing else — a job that is taken or expires while the
 * board is open keeps its place and says so on its own card. See `JobCard`.
 *
 * **NO CURRENCY MATHS ANYWHERE.** The pay bands compare `payValue`, a number
 * the app supplies for comparison only, and their words are the app's too:
 * `payBands` has no default, because a default band would have to invent a
 * currency. Distance and time have defaults because a kilometre and a minute
 * are not somebody's.
 */

function JobBoardComponent({
  jobs,
  sort: sortProp,
  defaultSort = 'pay',
  onSortChange,
  sortOptions = JOB_BOARD_SORTS,
  filtersOpen: filtersOpenProp,
  defaultFiltersOpen = false,
  onFiltersOpenChange,
  filter: filterProp,
  defaultFilter,
  onFilterChange,
  distanceBands = JOB_DISTANCE_BANDS,
  payBands,
  whenBands = JOB_WHEN_BANDS,
  vehicleKinds = JOB_VEHICLE_KINDS,
  showCount = true,
  onRefresh,
  refreshing = false,
  loading = false,
  loadingCount = 3,
  onTake,
  onPass,
  onPressJob,
  selectedId = null,
  density = 'comfortable',
  route,
  breakdown,
  emptyTitle = 'No jobs right now',
  emptyDescription = 'Nothing matches what you are looking for. Widen a filter, or pull the board again in a minute.',
  emptyAction,
  labels: labelOverrides,
  accessibilityLabel = 'Jobs',
  style,
  testID,
}: JobBoardProps) {
  const theme = useTheme();
  const ambient = useSurfaceLevel(0);
  const paint = useMemo(
    () => resolveJobPaint(theme, ambient.background),
    [theme, ambient.background],
  );
  const labels = useMemo(
    () => ({
      ...JOB_BOARD_LABELS,
      ...labelOverrides,
      sortOptions: { ...JOB_BOARD_LABELS.sortOptions, ...labelOverrides?.sortOptions },
      filters: { ...JOB_BOARD_LABELS.filters, ...labelOverrides?.filters },
    }),
    [labelOverrides],
  );
  const [sort, setSort] = useControllableState<JobBoardSort>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [filter, setFilter] = useControllableState<JobBoardFilter>({
    value: filterProp,
    defaultValue: defaultFilter ?? {},
    onChange: onFilterChange,
  });
  const [filtersOpen, setFiltersOpen] = useControllableState<boolean>({
    value: filtersOpenProp,
    defaultValue: defaultFiltersOpen,
    onChange: onFiltersOpenChange,
  });

  const shown = useMemo(() => sortJobOffers(filterJobOffers(jobs, filter), sort), [jobs, filter, sort]);
  const active = countActiveJobFilters(filter);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const setBand = useCallback(
    (key: 'maxDistanceKm' | 'minPay' | 'startsWithinMinutes', value: number | null) => {
      setFilter({ ...filter, [key]: value });
    },
    [filter, setFilter],
  );
  const toggleVehicle = useCallback(
    (vehicle: VehicleKind) => {
      setFilter({ ...filter, vehicles: toggleJobVehicle(filter.vehicles, vehicle) });
    },
    [filter, setFilter],
  );
  const clear = useCallback(() => setFilter({}), [setFilter]);

  const vehicleWords = useMemo(() => {
    const out = new Map<string, string>();
    for (const option of VEHICLE_OPTIONS) out.set(option.value, option.label);
    return out;
  }, []);

  /** One dimension: a named, sideways-scrolling `radiogroup` of bands. */
  const bandRow = (
    key: 'maxDistanceKm' | 'minPay' | 'startsWithinMinutes',
    name: string,
    bands: readonly JobBoardBand[] | undefined,
  ) => {
    // One band is not a choice: a row the reader cannot change is chrome.
    if (bands === undefined || bands.length < 2) return null;
    const current = filter[key] ?? null;
    return (
      <ChipRow
        role="radiogroup"
        accessibilityLabel={name}
        fadeColor={ambient.background}
        testID={id(`filter-${key}`)}
      >
        {bands.map((band) => (
          <Chip
            key={String(band.value)}
            role="radio"
            // 32 drawn, 44 under a thumb through `Chip`'s own hitSlop: this is
            // a control, not a label.
            size="xl"
            variant="outlined"
            selected={current === band.value}
            onPress={() => setBand(key, band.value)}
            accessibilityLabel={`${name}, ${band.label}`}
            testID={id(`filter-${key}-${band.value ?? 'any'}`)}
          >
            {band.label}
          </Chip>
        ))}
      </ChipRow>
    );
  };

  const chosenVehicles = filter.vehicles ?? [];
  const vehicleRow =
    vehicleKinds.length === 0 ? null : (
      <ChipRow
        role="group"
        accessibilityLabel={labels.filters.vehicle}
        fadeColor={ambient.background}
        testID={id('filter-vehicles')}
      >
        {vehicleKinds.map((vehicle) => {
          const word = vehicleWords.get(vehicle) ?? vehicle;
          return (
            <Chip
              key={vehicle}
              role="button"
              size="xl"
              variant="outlined"
              leadingIcon={VEHICLE_ICON[vehicle]}
              selected={chosenVehicles.includes(vehicle)}
              onPress={() => toggleVehicle(vehicle)}
              accessibilityLabel={`${labels.filters.vehicle}, ${word}`}
              testID={id(`filter-vehicle-${vehicle}`)}
            >
              {word}
            </Chip>
          );
        })}
      </ChipRow>
    );

  const filterRows = [
    bandRow('maxDistanceKm', labels.filters.distance, distanceBands),
    bandRow('minPay', labels.filters.pay, payBands),
    bandRow('startsWithinMinutes', labels.filters.when, whenBands),
    vehicleRow,
  ].filter((row) => row !== null);

  const filters =
    filterRows.length === 0 || !filtersOpen ? null : (
      <View style={{ gap: 8 }} testID={id('filters')}>
        {filterRows.map((row, index) => (
          <React.Fragment key={index}>{row}</React.Fragment>
        ))}
        {active > 0 ? (
          <View style={{ flexDirection: 'row' }}>
            <Button
              variant="text"
              size="small"
              onPress={clear}
              accessibilityLabel={labels.clearFilters}
              testID={id('clear')}
            >
              {labels.clearFilters}
            </Button>
          </View>
        ) : null}
      </View>
    );

  // No head at all until there is something to count and something to do to it.
  // "0 jobs" over a control that can reorder nothing is chrome for a board that
  // does not exist yet.
  const head =
    jobs.length > 0 &&
    (showCount || sortOptions.length > 0 || onRefresh !== undefined || filterRows.length > 0) ? (
      <View style={{ gap: 8 }} testID={id('head')}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          {showCount ? (
            <Text
              variant="body-semibold"
              role="heading"
              aria-level={3}
              style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
              testID={id('count')}
            >
              {labels.count(shown.length)}
            </Text>
          ) : (
            <View />
          )}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 8 }}
          >
            {filterRows.length > 0 ? (
              <Button
                variant="secondary"
                size="small"
                leadingIcon={RiEqualizerLine}
                onPress={() => setFiltersOpen(!filtersOpen)}
                // `aria-expanded` on both spellings: react-native-web reads only
                // the flat prop, React Native folds it back into the state.
                // React Native folds `aria-expanded` back into
                // `accessibilityState`, and react-native-web reads ONLY the
                // flat prop — so one spelling reaches both.
                aria-expanded={filtersOpen}
                accessibilityLabel={
                  active > 0
                    ? `${labels.filtersToggle}, ${labels.filtersActive(active)}`
                    : labels.filtersToggle
                }
                testID={id('filters-toggle')}
              >
                {labels.filtersToggle}
              </Button>
            ) : null}
            {/* The count of what is narrowed, so a FOLDED filter is never a
                hidden one. A bare numeral says nothing to a screen reader, so
                it is hidden from one and the disclosure's NAME carries the
                count instead. */}
            {filterRows.length > 0 && active > 0 ? (
              <View aria-hidden testID={id('filters-count')}>
                <Badge content={active} variant="subtle" color="primary" size="medium" />
              </View>
            ) : null}
            {onRefresh ? (
              <GlyphButton
                icon={RiRefreshLine}
                size={JOB_BOARD_GEOMETRY.refresh}
                onPress={onRefresh}
                // While a pull is in flight the control is inert rather than
                // spinning: Bloom draws no press animation, and a second pull
                // would race the first.
                disabled={refreshing}
                accessibilityLabel={labels.refresh}
                testID={id('refresh')}
              />
            ) : null}
          </View>
        </View>
        {sortOptions.length > 0 ? (
          // A SCROLLER, not a wrapping row: four orders at 390 overflowed the
          // head, and a wrapped sort under a wrapped count is two lines of
          // chrome over the first job.
          <ChipRow
            role="radiogroup"
            accessibilityLabel={labels.sort}
            fadeColor={ambient.background}
            testID={id('sort')}
          >
            {sortOptions.map((option) => (
              <Chip
                key={option}
                role="radio"
                size="xl"
                variant="outlined"
                selected={sort === option}
                onPress={() => setSort(option)}
                accessibilityLabel={`${labels.sort}, ${labels.sortOptions[option]}`}
                testID={id(`sort-${option}`)}
              >
                {labels.sortOptions[option]}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </View>
    ) : null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View
        aria-busy
        accessibilityState={{ busy: true }}
        accessibilityLabel={labels.loading}
        style={{ gap: 12 }}
        testID={id('loading')}
      >
        {Array.from({ length: Math.max(1, loadingCount) }, (_unused, index) => (
          <Card
            key={index}
            variant="outlined"
            radius="radius-20"
            style={surfaceFillVars(theme.colors.card)}
            testID={id(`placeholder-${index}`)}
          >
            <View
              style={{
                paddingTop: JOB_BOARD_GEOMETRY.padding,
                paddingBottom: JOB_BOARD_GEOMETRY.padding,
                paddingLeft: JOB_BOARD_GEOMETRY.padding,
                paddingRight: JOB_BOARD_GEOMETRY.padding,
                gap: JOB_BOARD_GEOMETRY.gap,
              }}
            >
              <Skeleton.Row style={{ alignItems: 'center', gap: 12 }}>
                <Skeleton.Box
                  width={JOB_BOARD_GEOMETRY.mark.comfortable}
                  height={JOB_BOARD_GEOMETRY.mark.comfortable}
                  borderRadius={JOB_BOARD_GEOMETRY.tileRadius}
                />
                <Skeleton.Col style={{ gap: 6 }}>
                  <Skeleton.Text style={{ width: 180 }} />
                  <Skeleton.Text style={{ width: 120 }} />
                </Skeleton.Col>
                <Skeleton.Box width={72} height={20} />
              </Skeleton.Row>
              <Skeleton.Box height={64} borderRadius={JOB_BOARD_GEOMETRY.tileRadius} />
            </View>
          </Card>
        ))}
      </View>
    );
  } else if (shown.length === 0) {
    body = (
      <View
        role="group"
        accessibilityLabel={emptyTitle}
        style={{
          alignItems: 'center',
          gap: 12,
          paddingTop: 32,
          paddingBottom: 32,
          paddingLeft: 24,
          paddingRight: 24,
        }}
        testID={id('empty')}
      >
        <IconCircle icon={RiInbox2Line} size="lg" />
        <Text
          variant="headline-semibold"
          style={{ color: paint.text, textAlign: 'center' }}
          testID={id('empty-title')}
        >
          {emptyTitle}
        </Text>
        {emptyDescription ? (
          <Text
            variant="body-regular"
            style={{ color: paint.textSecondary, textAlign: 'center', maxWidth: 360 }}
          >
            {emptyDescription}
          </Text>
        ) : null}
        {emptyAction ??
          (active > 0 ? (
            <Button
              variant="secondary"
              size="medium"
              onPress={clear}
              accessibilityLabel={labels.clearFilters}
              testID={id('empty-clear')}
            >
              {labels.clearFilters}
            </Button>
          ) : null)}
      </View>
    );
  } else {
    body = (
      <View style={{ gap: 12 }}>
        {shown.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onTake={onTake}
            onPass={onPass}
            onPressJob={onPressJob}
            selected={selectedId === job.id}
            density={density}
            route={route}
            breakdown={breakdown}
            labels={labelOverrides}
            testID={id(job.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: 16 }, style]}
    >
      {head}
      {filters}
      {body}
    </View>
  );
}

export const JobBoard = memo(JobBoardComponent);
JobBoard.displayName = 'JobBoard';
