// Values TS had typed that Bloom reads the same way (lang-mention-10):
// - `x as Trend['type']` where Bloom expects the union: `x as! (union)`, also around a spelled `a || b`;
// - a function read from a `Record<K, F>` TS typed present, then called: `ICONS[k]!`;
// - JS `s.slice(n)`: `s.slice(n, s.count)`;
// - i18next's `t(key, "default", { … })`: the default is `defaultValue:`;
// - an optional number member tested for truthiness narrows (`x != none && x != 0`);
// - `xs.filter((x): x is T => …)`: `compactMap`, so the list is of `T`.
import { Embed, Text, VStack, view } from '@oxy.so/bloom-language';
import { RiAlertLine, RiExchangeLine } from '@oxy.so/bloom/icons/RiAlertLine';
import { type Trend, type TrendingTopic, formatCount, hosts, rows, t } from './trends';

type Mode = 'alert' | 'exchange';
const ICONS: Record<Mode, typeof RiAlertLine> = { alert: RiAlertLine, exchange: RiExchangeLine };

function toTrend(topic: TrendingTopic): Trend {
  return { type: (topic.type || 'hashtag') as Trend['type'], name: topic.name, direction: 'flat' };
}

function folder(tabId: string, prefix: string): string {
  return tabId.slice(prefix.length);
}

function people(trend: Trend): string {
  if (trend.authorCount && trend.authorCount > 0) return formatCount(trend.authorCount);
  return t('trend.people', 'Attached {{number}}', { number: 1 });
}

export function load(topics: TrendingTopic[]) {
  rows(topics.map(toTrend));
  hosts(topics.map((topic) => topic.host).filter((host): host is string => Boolean(host)));
}

export const TrendIcon = view(function TrendIcon({ mode, trend }: { mode: Mode; trend: Trend }) {
  const Glyph = ICONS[mode];
  return VStack(Text(people(trend)), Text(folder(trend.name, '#')), Embed(<Glyph width={20} height={20} fill="red" />));
});
