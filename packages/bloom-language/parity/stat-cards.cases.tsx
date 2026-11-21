import { RiLineChartLine, RiUserLine } from '@oxy.so/bloom/icons';
import { StatCard, StatCards } from '@oxy.so/bloom/stat-cards';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const REVENUE = {
  icon: RiLineChartLine,
  label: 'Revenue',
  value: '$152,313',
  delta: '-1.2%',
  deltaColor: 'rose' as const,
  tone: 'orange' as const,
  caption: 'From last month',
  hint: 'Gross, before refunds',
};
const STATS = [
  {
    icon: RiUserLine,
    label: 'Users',
    value: '14,592',
    delta: '+5.3%',
    deltaColor: 'lime' as const,
  },
  REVENUE,
  { icon: RiUserLine, label: 'Churn', value: '2.1%', delta: '0%', deltaColor: 'neutral' as const },
];

export const STAT_CARD_CASES: ParityCase[] = [
  ...ENUMS.statCardsVariant.map((variant) => ({
    name: `StatCard ${variant}`,
    language: () => toElement(L.StatCard(REVENUE).style(variant)),
    bloom: () => <StatCard stat={REVENUE} variant={variant} />,
  })),
  {
    name: 'StatCards',
    language: () => toElement(L.StatCards(STATS)),
    bloom: () => <StatCards stats={STATS} />,
  },
  ...ENUMS.statCardsVariant.flatMap((variant) =>
    ([1, 2, 3, 4] as const).map((columns) => ({
      name: `StatCards ${variant}, ${columns} columns`,
      language: () => toElement(L.StatCards(STATS).style(variant).columns(columns)),
      bloom: () => <StatCards stats={STATS} variant={variant} columns={columns} />,
    })),
  ),
];
