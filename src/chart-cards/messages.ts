import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the chart cards draw or announce, in each Bloom language:
 * the cards' default titles, the comparison labels and captions, and the
 * sentences a chart is announced by. A caller's `title`, `*Label` and
 * `accessibilityLabel` props still win. The data's own labels (series names,
 * month abbreviations a caller passes) are the app's and stay as given.
 */
export interface ChartCardsMessages {
  titles: {
    activity: string;
    agents: string;
    visitors: string;
    breakdown: string;
    sessions: string;
    contributionsThisYear: string;
    earnedSoFar: string;
    signUpFunnel: string;
    activeUsers: string;
    revenue: string;
    mostActiveDays: string;
    orders: string;
    trackedTime: string;
    revenuePerAccount: string;
    sleepScore: string;
    pipeline: string;
    steps: string;
    tokens: string;
  };
  weekly: string;
  monthly: string;
  yearly: string;
  stepsSuffix: string;
  today: string;
  thisYear: string;
  lastYear: string;
  sinceLastYear: string;
  aYearEarlier: string;
  earningsPeriod: string;
  changePeriod: string;
  period: string;
  total: string;
  average: string;
  thisMonth: string;
  ofGoal: string;
  totalSteps: string;
  gaugeChart: (title: string, reading: string) => string;
  halfGaugeChart: (title: string, items: string) => string;
  radialChart: (title: string, items: string) => string;
  percentOfGoal: (pct: number) => string;
  periodOf: (label: string) => string;
  chartVs: (title: string, current: string, previous: string) => string;
  lineChart: (title: string) => string;
  barChart: (title: string, items: string) => string;
  comboChart: (title: string, bar: string, line: string) => string;
  scatterChart: (title: string, series: string) => string;
  bubbleChart: (title: string, series: string) => string;
  ringItem: (label: string, value: string, pct: number) => string;
  scoreOf: (score: string, max: string) => string;
  activityFor: (name: string, day: number) => string;
  contributions: (count: number, date: string | undefined) => string;
}

export const CHART_CARDS_MESSAGES: MessageCatalog<ChartCardsMessages> = defineMessages<ChartCardsMessages>('CHART_CARDS_MESSAGES', {
  titles: {
    activity: 'Activity',
    agents: 'Agents',
    visitors: 'Visitors',
    breakdown: 'Breakdown',
    sessions: 'Sessions',
    contributionsThisYear: 'Contributions this year',
    earnedSoFar: 'Earned so far',
    signUpFunnel: 'Sign-up funnel',
    activeUsers: 'Active users',
    revenue: 'Revenue',
    mostActiveDays: 'Most active days',
    orders: 'Orders',
    trackedTime: 'Tracked time',
    revenuePerAccount: 'Revenue per account',
    sleepScore: 'Sleep score',
    pipeline: 'Pipeline',
    steps: 'Steps',
    tokens: 'Tokens',
  },
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  stepsSuffix: 'steps',
  today: 'Today',
  thisYear: 'This year',
  lastYear: 'Last year',
  sinceLastYear: 'last year',
  aYearEarlier: 'a year earlier',
  earningsPeriod: 'Earnings period',
  changePeriod: 'Change period',
  period: 'Period',
  total: 'total',
  average: 'average',
  thisMonth: 'this month',
  ofGoal: 'of goal',
  totalSteps: 'total steps',
  gaugeChart: (title, reading) => `${title} gauge: ${reading}`,
  halfGaugeChart: (title, items) => `${title} half gauge: ${items}`,
  radialChart: (title, items) => `${title} radial chart: ${items}`,
  percentOfGoal: (pct) => `${pct}% of goal`,
  periodOf: (label) => `${label} period`,
  chartVs: (title, current, previous) => `${title} chart: ${current.toLowerCase()} against ${previous.toLowerCase()}`,
  lineChart: (title) => `${title} line chart`,
  barChart: (title, items) => `${title} bar chart: ${items}`,
  comboChart: (title, bar, line) => `${title} chart: ${bar} bars against ${line} line`,
  scatterChart: (title, series) => `${title} scatter chart: ${series}`,
  bubbleChart: (title, series) => `${title} bubble chart: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct}% of goal`,
  scoreOf: (score, max) => `${score} of ${max}`,
  activityFor: (name, day) => `Activity for ${name} ${day}`,
  contributions: (n, date) => { const on = date ? ` on ${date}` : ''; return n === 0 ? `No contributions${on}` : plural('en', n, { one: `{n} contribution${on}`, other: `{n} contributions${on}` }); },
});
