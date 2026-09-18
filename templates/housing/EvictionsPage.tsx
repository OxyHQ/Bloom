import React, { useState } from 'react';
import { View } from 'react-native';

import { Admonition, AdmonitionText } from '../../src/admonition';
import { Button } from '../../src/button';
import { EvictionReportCard, EvictionTimeline } from '../../src/eviction';
import { RiAddLine, RiArrowDownSLine, RiArrowUpSLine } from '../../src/icons/remix';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../../src/segmented-control';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { CASE_HISTORY, REPORTS } from './data';
import { HousingFrame, HousingHeader, PageColumn, useHousingLayout, webSticky } from './HousingHeader';

const noop = () => undefined;

/**
 * Community eviction reports: upcoming and past, one card expanded with its
 * case history (beside the list from `lg`), and the privacy note that explains
 * why every area is coarse.
 */
export function EvictionsPage() {
  const theme = useTheme();
  const { md, lg } = useHousingLayout();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expanded, setExpanded] = useState<string | null>('almond');
  const [attending, setAttending] = useState<Record<string, boolean>>({ almond: true });

  const shown = REPORTS.filter((report) => report.past === (tab === 'past'));
  const open = shown.find((report) => report.id === expanded);

  const history = (
    <View style={{ gap: 16 }} testID="housing-case-history">
      <Text role="heading" aria-level={2} variant="headline-semibold" style={{ color: theme.colors.text }}>
        Case history
      </Text>
      <EvictionTimeline events={CASE_HISTORY} />
    </View>
  );

  return (
    <HousingFrame testID="housing-evictions">
      <HousingHeader />
      <PageColumn maxWidth={1120} style={{ paddingTop: md ? 32 : 20, paddingBottom: 64, gap: 24 }}>
        <View style={{ flexDirection: md ? 'row' : 'column', alignItems: md ? 'flex-end' : 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Text role="heading" aria-level={1} variant="title-1-semibold" style={{ color: theme.colors.text }}>
              Evictions near you
            </Text>
            <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
              Reported by neighbours and housing groups. Show up, share, or offer support.
            </Text>
          </View>
          <Button variant="primary" leadingIcon={RiAddLine} onPress={noop}>
            Report an eviction
          </Button>
        </View>

        <Admonition type="info">
          <AdmonitionText>
            To protect the people involved, reports show only a neighbourhood or a street without a number. Details are checked by the
            community, not by an authority, before they are published.
          </AdmonitionText>
        </Admonition>

        <SegmentedControl
          label="Show evictions"
          type="tabs"
          size="large"
          value={tab}
          onChange={(next) => {
            setTab(next);
            setExpanded(next === 'upcoming' ? 'almond' : 'ribera');
          }}
          style={{ alignSelf: md ? 'flex-start' : 'stretch' }}
        >
          <SegmentedControlItem value="upcoming">
            <SegmentedControlItemText>Upcoming</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="past">
            <SegmentedControlItemText>Past</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>

        <View style={{ flexDirection: lg ? 'row' : 'column', alignItems: 'flex-start', gap: 32 }}>
          <View style={{ flex: lg ? 1 : undefined, width: lg ? undefined : '100%', gap: 16, minWidth: 0 }}>
            {shown.map(({ id, past: _past, ...report }) => {
              const active = report.status === 'scheduled' || report.status === 'postponed';
              const isOpen = expanded === id;
              return (
                <View key={id} style={{ gap: 12 }}>
                  <EvictionReportCard
                    {...report}
                    numberOfLines={isOpen ? 0 : 3}
                    attending={active ? attending[id] ?? false : undefined}
                    onAttendingChange={active ? (next) => setAttending((a) => ({ ...a, [id]: next })) : undefined}
                    onShare={noop}
                    onContactSupport={report.organisationsLabel ? noop : undefined}
                    testID={`housing-eviction-${id}`}
                  />
                  <Button
                    variant="link"
                    linkTone="secondary"
                    size="small"
                    trailingIcon={isOpen ? RiArrowUpSLine : RiArrowDownSLine}
                    onPress={() => setExpanded(isOpen ? null : id)}
                    aria-expanded={isOpen}
                    style={{ alignSelf: 'flex-start' }}
                    testID={`housing-eviction-${id}-toggle`}
                  >
                    {isOpen ? 'Hide case history' : 'Show case history'}
                  </Button>
                  {isOpen && !lg ? history : null}
                </View>
              );
            })}
          </View>
          {lg ? (
            <View style={[{ width: 380 }, webSticky(24)]}>
              {open ? (
                history
              ) : (
                <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
                  Open a report to see its case history.
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </PageColumn>
    </HousingFrame>
  );
}
