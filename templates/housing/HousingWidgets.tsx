import React from 'react';
import { View } from 'react-native';

import { Badge } from '../../src/badge';
import { Button } from '../../src/button';
import { Card, CardBody, CardHeader, CardTitle } from '../../src/card';
import { SavedSearchCard } from '../../src/home-search';
import { RiAlarmWarningLine, RiArrowRightLine, RiMegaphoneLine } from '../../src/icons/remix';
import { NeighbourhoodScores, PricePerAreaComparison } from '../../src/property-insights';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { AREA_PRICES, NEIGHBOURHOOD, REPORTS, SAVED_SEARCHES } from './data';
import { useHousingNav } from './HousingHeader';

const noop = () => undefined;

/**
 * One widget: a title row with an optional action, then the body. Every widget
 * in the column is the same `Card`, so the column reads as one thing rather
 * than as four components that happened to be stacked.
 */
function Widget({
  title,
  action,
  children,
  testID,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <Card variant="outlined" radius="radius-16" testID={testID}>
      <CardHeader style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <CardTitle numberOfLines={1}>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

/**
 * The widget column beside the page: the searches you keep, what the area is
 * worth and what it is like, the evictions being called near you, and the one
 * thing the app wants from a visitor who owns a home.
 *
 * It is the shell's `aside`, so the shell decides when it is worth the width
 * (`asideFrom`, `asideCollapse="hidden"`) — the widgets never compete with the
 * results for a narrow screen.
 */
export function HousingWidgets({ testID = 'housing-widgets' }: { testID?: string }) {
  const theme = useTheme();
  const go = useHousingNav();
  const next = REPORTS.filter((report) => !report.past).slice(0, 2);

  return (
    <View style={{ gap: 16, paddingBottom: 24 }} testID={testID}>
      <Widget
        title="Saved searches"
        action={
          <Button variant="link" linkTone="secondary" size="small" onPress={() => go('saved')}>
            See all
          </Button>
        }
        testID="housing-widget-searches"
      >
        <View style={{ gap: 12 }}>
          {SAVED_SEARCHES.slice(0, 2).map(({ id, ...search }) => (
            <SavedSearchCard key={id} {...search} onPress={() => go('explore')} onEdit={noop} testID={`housing-widget-search-${id}`} />
          ))}
        </View>
      </Widget>

      <Widget title="What this area costs" testID="housing-widget-prices">
        <PricePerAreaComparison rows={AREA_PRICES} accessibilityLabel="Price per square metre in Old Halden" />
      </Widget>

      <Widget title="What it is like to live here" testID="housing-widget-area">
        <NeighbourhoodScores items={NEIGHBOURHOOD} columns={1} />
      </Widget>

      <Widget
        title="Evictions near you"
        action={<Badge color="warning" content={next.length} />}
        testID="housing-widget-evictions"
      >
        <View style={{ gap: 12 }}>
          {next.map((report) => (
            <View key={report.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <RiAlarmWarningLine width={18} height={18} fill={theme.colors.warning} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="body-2-semibold" numberOfLines={1} style={{ color: theme.colors.text }}>
                  {report.area}
                </Text>
                <Text variant="body-2-regular" numberOfLines={1} style={{ color: theme.colors.textSecondary }}>
                  {report.date} · {report.relativeLabel}
                </Text>
              </View>
            </View>
          ))}
          <Button variant="secondary" size="small" trailingIcon={RiArrowRightLine} onPress={() => go('evictions')}>
            See the calendar
          </Button>
        </View>
      </Widget>

      <Widget title="Own a home?" testID="housing-widget-publish">
        <View style={{ gap: 12 }}>
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            Rent it, sell it, swap it or offer it for a season. Listing is free and takes about ten minutes.
          </Text>
          <Button variant="primary" size="small" leadingIcon={RiMegaphoneLine} onPress={() => go('publish')}>
            List your home
          </Button>
        </View>
      </Widget>
    </View>
  );
}
