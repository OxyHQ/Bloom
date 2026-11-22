import { ActivityFeed, type ActivityFeedEntry } from '@oxy.so/bloom/activity-feed';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const ENTRIES: ActivityFeedEntry[] = [
  {
    id: 'a1',
    kind: 'call',
    day: 'Today',
    timestamp: '14:10',
    title: 'called Nora about the renewal',
    actor: { name: 'Marta Oyeleye' },
    body: 'She wants the three-site rollout split across two budget years. Finance has to confirm whether the second tranche can be invoiced in January, and she asked for the revised schedule before the board meets.',
    outcome: 'Renewal likely',
    outcomeTone: 'success',
    loggedBy: 'Marta Oyeleye',
  },
  {
    id: 'a2',
    kind: 'stage-change',
    day: 'Today',
    timestamp: '11:02',
    title: 'moved the deal from Qualified to Proposal',
    actor: { name: 'Teodor Nagy' },
    outcome: 'Proposal',
    outcomeTone: 'warning',
  },
  {
    id: 'a3',
    day: 'Yesterday',
    timestamp: '17:45',
    title: 'edited the page',
    actor: { name: 'Marta Oyeleye' },
    context: <Text>Launch plan</Text>,
    action: <Text>Open</Text>,
    loggedBy: 'Automation',
  },
];

const DENSITY = { default: 'comfortable', compact: 'compact' } as const;
const loggedBy = (name: string) => `Recorded by ${name}`;

export const ACTIVITY_FEED_CASES: ParityCase[] = [
  {
    name: 'ActivityFeed',
    language: () => toElement(L.ActivityFeed(ENTRIES)),
    bloom: () => <ActivityFeed entries={ENTRIES} />,
  },
  ...ENUMS.activityFeedGrouping.flatMap((grouping) =>
    ENUMS.density.map((density) => ({
      name: `ActivityFeed ${grouping}, ${density}`,
      language: () => toElement(L.ActivityFeed(ENTRIES).style(grouping).density(density)),
      bloom: () => (
        <ActivityFeed entries={ENTRIES} grouping={grouping} density={DENSITY[density]} />
      ),
    })),
  ),
  ...[0, 1].map((lines) => ({
    name: `ActivityFeed bodies clamped to ${lines}, its words, named`,
    language: () =>
      toElement(
        L.ActivityFeed(ENTRIES, { moreLabel: 'More', lessLabel: 'Less', formatLoggedBy: loggedBy })
          .lines(lines)
          .label('Updates'),
      ),
    bloom: () => (
      <ActivityFeed
        entries={ENTRIES}
        bodyLines={lines}
        moreLabel="More"
        lessLabel="Less"
        formatLoggedBy={loggedBy}
        accessibilityLabel="Updates"
      />
    ),
  })),
  {
    name: 'ActivityFeed empty',
    language: () => toElement(L.ActivityFeed([], { emptyLabel: 'Nothing yet' })),
    bloom: () => <ActivityFeed entries={[]} emptyLabel="Nothing yet" />,
  },
];
